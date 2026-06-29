import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { Parser } from 'json2csv'

const getDateRange = (period: string): { start: Date; end: Date } => {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'today': start.setHours(0, 0, 0, 0); break
    case 'week': start.setDate(start.getDate() - 7); break
    case 'month': start.setMonth(start.getMonth() - 1); break
    case '3months': start.setMonth(start.getMonth() - 3); break
    case 'year': start.setFullYear(start.getFullYear() - 1); break
    default: start.setMonth(start.getMonth() - 1)
  }

  return { start, end }
}

export const getOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const [
    totalOrders, completedOrders, cancelledOrders, pendingOrders,
    totalRevenue, totalCustomers, newCustomers, totalRiders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.order.count({ where: { status: 'delivered', createdAt: { gte: start, lte: end } } }),
    prisma.order.count({ where: { status: 'cancelled', createdAt: { gte: start, lte: end } } }),
    prisma.order.count({
      where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready'] }, createdAt: { gte: start, lte: end } }
    }),
    prisma.payment.aggregate({
      where: { paymentStatus: 'successful', createdAt: { gte: start, lte: end } },
      _sum: { amount: true }
    }),
    prisma.user.count({ where: { role: 'customer', deletedAt: null } }),
    prisma.user.count({ where: { role: 'customer', deletedAt: null, createdAt: { gte: start, lte: end } } }),
    prisma.user.count({ where: { role: 'rider', deletedAt: null, isActive: true } }),
  ])

  const revenue = Number(totalRevenue._sum.amount || 0)
  const avgOrderValue = completedOrders > 0 ? revenue / completedOrders : 0

  res.status(200).json({
    period,
    overview: {
      orders: {
        total: totalOrders, completed: completedOrders,
        cancelled: cancelledOrders, pending: pendingOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      },
      revenue: { total: revenue, average: Math.round(avgOrderValue), currency: 'NGN' },
      customers: { total: totalCustomers, new: newCustomers },
      riders: { active: totalRiders }
    }
  })
}

export const getRevenueOverTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const payments = await prisma.payment.findMany({
    where: { paymentStatus: 'successful', createdAt: { gte: start, lte: end } },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })

  const revenueByDate: Record<string, number> = {}
  for (const payment of payments) {
    const date = payment.createdAt.toISOString().split('T')[0]
    revenueByDate[date] = (revenueByDate[date] || 0) + Number(payment.amount)
  }

  const data = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue }))
  res.status(200).json({ period, data })
}

export const getOrdersOverTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { status: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })

  const ordersByDate: Record<string, { total: number; completed: number; cancelled: number }> = {}

  for (const order of orders) {
    const date = order.createdAt.toISOString().split('T')[0]
    if (!ordersByDate[date]) ordersByDate[date] = { total: 0, completed: 0, cancelled: 0 }
    ordersByDate[date].total++
    if (order.status === 'delivered') ordersByDate[date].completed++
    if (order.status === 'cancelled') ordersByDate[date].cancelled++
  }

  const data = Object.entries(ordersByDate).map(([date, counts]) => ({ date, ...counts }))
  res.status(200).json({ period, data })
}

export const getTopSellingItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month', limit = '10' } = req.query
  const { start, end } = getDateRange(period as string)
  const limitNum = parseInt(limit as string)

  const orderItems = await prisma.orderPackageItem.findMany({
    where: {
      orderPackage: {
        order: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } }
      }
    },
    select: { menuItemId: true, itemName: true, quantity: true, totalPrice: true }
  })

  const itemMap: Record<string, {
    menuItemId: string; itemName: string;
    totalQuantity: number; totalRevenue: number; orderCount: number
  }> = {}

  for (const item of orderItems) {
    if (!itemMap[item.menuItemId]) {
      itemMap[item.menuItemId] = {
        menuItemId: item.menuItemId, itemName: item.itemName,
        totalQuantity: 0, totalRevenue: 0, orderCount: 0,
      }
    }
    itemMap[item.menuItemId].totalQuantity += item.quantity
    itemMap[item.menuItemId].totalRevenue += Number(item.totalPrice)
    itemMap[item.menuItemId].orderCount++
  }

  const topItems = Object.values(itemMap)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limitNum)

  res.status(200).json({ period, topItems })
}

export const getPeakHours = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
    select: { createdAt: true }
  })

  const hourCounts: Record<number, number> = {}
  for (let i = 0; i < 24; i++) hourCounts[i] = 0
  for (const order of orders) hourCounts[order.createdAt.getHours()]++

  const data = Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour),
    label: `${hour.toString().padStart(2, '0')}:00`,
    orders: count,
  }))

  res.status(200).json({ period, data })
}

export const getPeakDays = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
    select: { createdAt: true }
  })

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayCounts: Record<string, number> = {}
  days.forEach(day => dayCounts[day] = 0)
  for (const order of orders) dayCounts[days[order.createdAt.getDay()]]++

  const data = days.map(day => ({ day, orders: dayCounts[day] }))
  res.status(200).json({ period, data })
}

export const getCustomerRetention = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
    select: { customerId: true }
  })

  const customerIds = [...new Set(orders.map(o => o.customerId))]
  let newCustomers = 0
  let returningCustomers = 0

  for (const customerId of customerIds) {
    const previousOrder = await prisma.order.findFirst({
      where: { customerId, createdAt: { lt: start }, status: { not: 'cancelled' } }
    })
    if (previousOrder) returningCustomers++
    else newCustomers++
  }

  const total = newCustomers + returningCustomers

  res.status(200).json({
    period,
    retention: {
      totalUniqueCustomers: total, newCustomers, returningCustomers,
      retentionRate: total > 0 ? Math.round((returningCustomers / total) * 100) : 0,
    }
  })
}

export const getRiderPerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const riders = await prisma.user.findMany({
    where: { role: 'rider', deletedAt: null },
    select: { id: true, fullName: true, phoneNumber: true, isActive: true }
  })

  const riderStats = await Promise.all(
    riders.map(async (rider) => {
      const [totalDeliveries, completedDeliveries, cancelledDeliveries] = await Promise.all([
        prisma.order.count({ where: { riderId: rider.id, createdAt: { gte: start, lte: end } } }),
        prisma.order.count({ where: { riderId: rider.id, status: 'delivered', createdAt: { gte: start, lte: end } } }),
        prisma.order.count({ where: { riderId: rider.id, status: 'cancelled', createdAt: { gte: start, lte: end } } }),
      ])
      return {
        ...rider,
        stats: {
          totalDeliveries, completedDeliveries, cancelledDeliveries,
          completionRate: totalDeliveries > 0
            ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0,
        }
      }
    })
  )

  riderStats.sort((a, b) => b.stats.completedDeliveries - a.stats.completedDeliveries)
  res.status(200).json({ period, riders: riderStats })
}

export const getPaymentMethodBreakdown = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const payments = await prisma.payment.findMany({
    where: { paymentStatus: 'successful', createdAt: { gte: start, lte: end } },
    select: { paymentMethod: true, amount: true }
  })

  const breakdown: Record<string, { count: number; total: number }> = {}
  for (const payment of payments) {
    const method = payment.paymentMethod
    if (!breakdown[method]) breakdown[method] = { count: 0, total: 0 }
    breakdown[method].count++
    breakdown[method].total += Number(payment.amount)
  }

  const data = Object.entries(breakdown).map(([method, stats]) => ({
    method, count: stats.count, total: stats.total, currency: 'NGN',
  }))

  res.status(200).json({ period, data })
}

export const exportOrdersCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'desc' },
    select: {
      orderNumber: true, orderType: true, status: true,
      subtotal: true, deliveryFee: true, discountAmount: true, totalAmount: true,
      createdAt: true,
      customer: { select: { fullName: true, phoneNumber: true } },
      payment: { select: { paymentMethod: true, paymentStatus: true } }
    }
  })

  const csvData = orders.map(order => ({
    'Order Number': order.orderNumber,
    'Date': order.createdAt.toISOString().split('T')[0],
    'Time': order.createdAt.toTimeString().split(' ')[0],
    'Customer Name': order.customer.fullName,
    'Customer Phone': order.customer.phoneNumber,
    'Order Type': order.orderType,
    'Status': order.status,
    'Subtotal (NGN)': Number(order.subtotal),
    'Delivery Fee (NGN)': Number(order.deliveryFee),
    'Discount (NGN)': Number(order.discountAmount),
    'Total (NGN)': Number(order.totalAmount),
    'Payment Method': order.payment?.paymentMethod || 'N/A',
    'Payment Status': order.payment?.paymentStatus || 'N/A',
  }))

  const parser = new Parser()
  const csv = parser.parse(csvData)

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition',
    `attachment; filename=orders-${period}-${new Date().toISOString().split('T')[0]}.csv`)
  res.status(200).send(csv)
}

export const exportRevenueCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const payments = await prisma.payment.findMany({
    where: { paymentStatus: 'successful', createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'desc' },
    select: {
      amount: true, paymentMethod: true, providerRef: true, paidAt: true, createdAt: true,
      order: { select: { orderNumber: true, customer: { select: { fullName: true, phoneNumber: true } } } }
    }
  })

  const csvData = payments.map(payment => ({
    'Date': payment.createdAt.toISOString().split('T')[0],
    'Time': payment.createdAt.toTimeString().split(' ')[0],
    'Order Number': payment.order.orderNumber,
    'Customer Name': payment.order.customer.fullName,
    'Customer Phone': payment.order.customer.phoneNumber,
    'Amount (NGN)': Number(payment.amount),
    'Payment Method': payment.paymentMethod,
    'Paystack Reference': payment.providerRef || 'N/A',
    'Paid At': payment.paidAt ? payment.paidAt.toISOString() : 'N/A',
  }))

  const parser = new Parser()
  const csv = parser.parse(csvData)

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition',
    `attachment; filename=revenue-${period}-${new Date().toISOString().split('T')[0]}.csv`)
  res.status(200).send(csv)
}

export const exportTopItemsCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { period = 'month' } = req.query
  const { start, end } = getDateRange(period as string)

  const orderItems = await prisma.orderPackageItem.findMany({
    where: {
      orderPackage: {
        order: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } }
      }
    },
    select: { menuItemId: true, itemName: true, quantity: true, totalPrice: true }
  })

  const itemMap: Record<string, { itemName: string; totalQuantity: number; totalRevenue: number }> = {}

  for (const item of orderItems) {
    if (!itemMap[item.menuItemId]) {
      itemMap[item.menuItemId] = { itemName: item.itemName, totalQuantity: 0, totalRevenue: 0 }
    }
    itemMap[item.menuItemId].totalQuantity += item.quantity
    itemMap[item.menuItemId].totalRevenue += Number(item.totalPrice)
  }

  const csvData = Object.values(itemMap)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .map((item, index) => ({
      'Rank': index + 1,
      'Item Name': item.itemName,
      'Total Quantity Sold': item.totalQuantity,
      'Total Revenue (NGN)': item.totalRevenue,
    }))

  const parser = new Parser()
  const csv = parser.parse(csvData)

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition',
    `attachment; filename=top-items-${period}-${new Date().toISOString().split('T')[0]}.csv`)
  res.status(200).send(csv)
}