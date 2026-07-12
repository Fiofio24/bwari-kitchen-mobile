import { Request, Response } from 'express'
import { logActivity } from '../lib/activityLog'
import prisma from '../lib/prisma'

export const adminGetOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { status, orderType, search, page = '1', limit = '20' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    ...(status && { status: status as any }),
    ...(orderType && { orderType: orderType as any }),
    ...(search && {
      orderNumber: { contains: search as string, mode: 'insensitive' as const }
    }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true, orderNumber: true, orderType: true, status: true,
        subtotal: true, deliveryFee: true, totalAmount: true,
        specialInstructions: true, estimatedDeliveryTime: true, createdAt: true,
        customer: { select: { id: true, fullName: true, phoneNumber: true } },
        rider: { select: { id: true, fullName: true, phoneNumber: true } },
        deliveryAddress: { select: { streetAddress: true, landmark: true, area: true } },
        orderPackages: {
          select: {
            packageName: true, totalPrice: true,
            items: { select: { itemName: true, quantity: true, unitPrice: true } }
          }
        },
        payment: { select: { paymentMethod: true, paymentStatus: true, amount: true } }
      }
    }),
    prisma.order.count({ where })
  ])

  res.status(200).json({
    orders,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  })
}

export const adminGetOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true, orderNumber: true, orderType: true, status: true,
      subtotal: true, deliveryFee: true, discountAmount: true, totalAmount: true,
      specialInstructions: true, estimatedDeliveryTime: true, actualDeliveryTime: true,
      cancellationReason: true, createdAt: true, updatedAt: true,
      customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
      rider: { select: { id: true, fullName: true, phoneNumber: true } },
      deliveryAddress: {
        select: {
          streetAddress: true, landmark: true, area: true,
          city: true, latitude: true, longitude: true,
        }
      },
      orderPackages: {
        select: {
          id: true, packageName: true, totalPrice: true,
          isCustom: true, wasEdited: true, originalPackageId: true,
          items: { select: { itemName: true, quantity: true, unitPrice: true, totalPrice: true } }
        }
      },
      payment: {
        select: {
          paymentMethod: true, paymentStatus: true, amount: true,
          provider: true, providerRef: true, paidAt: true,
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        select: {
          status: true,
          note: true,
          changedByType: true,   
          createdAt: true,
        }
      },
      delivery: {
        select: {
          currentLatitude: true, currentLongitude: true,
          pickupTime: true, estimatedArrival: true, lastUpdated: true,
        }
      }
    }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  res.status(200).json({ order })
}

export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { status, note } = req.body

  const validStatuses = [
    'confirmed', 'preparing', 'ready', 'picked_up',
    'on_the_way', 'delivered', 'cancelled', 'refunded',
  ]

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    })
    return
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true, customerId: true, orderType: true }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  const invalidTransitions: Record<string, string[]> = {
    delivered: ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'cancelled'],
    cancelled: ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered'],
    refunded: ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'],
  }

  if (invalidTransitions[order.status]?.includes(status)) {
    res.status(400).json({
      message: `Cannot change status from ${order.status} to ${status}`
    })
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'delivered' && { actualDeliveryTime: new Date() }),
      }
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        changedById: req.admin!.id,
        changedByType: 'admin',
        note: note || null,
      }
    })

    const statusMessages: Record<string, string> = {
      confirmed: `Your order ${order.orderNumber} has been confirmed and will be prepared shortly.`,
      preparing: `Your order ${order.orderNumber} is being prepared.`,
      ready: order.orderType === 'pickup'
        ? `Your order ${order.orderNumber} is ready for pickup.`
        : `Your order ${order.orderNumber} is ready and waiting for a rider.`,
      picked_up: `Your order ${order.orderNumber} has been picked up by the rider.`,
      on_the_way: `Your order ${order.orderNumber} is on the way to you.`,
      delivered: `Your order ${order.orderNumber} has been delivered. Enjoy your meal!`,
      cancelled: `Your order ${order.orderNumber} has been cancelled.`,
      refunded: `Your order ${order.orderNumber} has been refunded.`,
    }

    await tx.notification.create({
      data: {
        userId: order.customerId,
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}`,
        body: statusMessages[status] || `Your order ${order.orderNumber} status has been updated to ${status}.`,
        type: 'order_update',
        relatedOrderId: id,
      }
    })
  })

  res.status(200).json({
    message: `Order status updated to ${status}`,
    orderNumber: order.orderNumber,
    status,
  })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'update_status',
    targetType: 'Order',
    targetId: id,
    description: `Updated order ${order.orderNumber} status to "${status}"`,
  })
}

export const assignRider = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { riderId } = req.body

  if (!riderId) {
    res.status(400).json({ message: 'Rider ID is required' })
    return
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true, customerId: true, orderType: true }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  if (order.orderType === 'pickup') {
    res.status(400).json({ message: 'Cannot assign a rider to a pickup order' })
    return
  }

  if (!['confirmed', 'preparing', 'ready'].includes(order.status)) {
    res.status(400).json({
      message: 'Rider can only be assigned to confirmed, preparing or ready orders'
    })
    return
  }

  const rider = await prisma.user.findFirst({
    where: { id: riderId, role: 'rider', isActive: true, deletedAt: null },
    select: { id: true, fullName: true, phoneNumber: true }
  })

  if (!rider) {
    res.status(404).json({ message: 'Rider not found or inactive' })
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { riderId } })

    await tx.deliveryTracking.upsert({
      where: { orderId: id },
      update: { riderId },
      create: { orderId: id, riderId }
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: order.status,
        changedById: req.admin!.id,
        changedByType: 'admin',
        note: `Rider ${rider.fullName} assigned`,
      }
    })

    await tx.notification.create({
      data: {
        userId: order.customerId,
        title: 'Rider Assigned',
        body: `${rider.fullName} has been assigned to deliver your order ${order.orderNumber}.`,
        type: 'order_update',
        relatedOrderId: id,
      }
    })
  })

  res.status(200).json({
    message: 'Rider assigned successfully',
    rider: { id: rider.id, fullName: rider.fullName, phoneNumber: rider.phoneNumber }
  })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'assign_rider',
    targetType: 'Order',
    targetId: id,
    description: `Assigned rider ${rider.fullName} to order ${order.orderNumber}`,
  })
}

export const getOrderStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalOrders, todayOrders, pendingOrders, preparingOrders,
    deliveredOrders, cancelledOrders, totalRevenue, todayRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'preparing' } }),
    prisma.order.count({ where: { status: 'delivered' } }),
    prisma.order.count({ where: { status: 'cancelled' } }),
    prisma.payment.aggregate({
      where: { paymentStatus: 'successful' },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { paymentStatus: 'successful', createdAt: { gte: today } },
      _sum: { amount: true }
    }),
  ])

  res.status(200).json({
    stats: {
      totalOrders, todayOrders, pendingOrders, preparingOrders,
      deliveredOrders, cancelledOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      todayRevenue: todayRevenue._sum.amount || 0,
      currency: 'NGN',
    }
  })
}

export const adminCancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { reason } = req.body

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true, customerId: true }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
    res.status(400).json({
      message: `Order cannot be cancelled. Current status: ${order.status}`
    })
    return
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: req.admin!.id,
        cancellationReason: reason || null,
      }
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'cancelled',
        changedById: req.admin!.id,
        changedByType: 'admin',
        note: reason || 'Cancelled by admin',
      }
    }),
    prisma.notification.create({
      data: {
        userId: order.customerId,
        title: 'Order Cancelled',
        body: `Your order ${order.orderNumber} has been cancelled by the restaurant.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'order_update',
        relatedOrderId: id,
      }
    })
  ])

  res.status(200).json({ message: 'Order cancelled successfully' })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'cancel',
    targetType: 'Order',
    targetId: id,
    description: `Cancelled order ${order.orderNumber}${reason ? ` — Reason: ${reason}` : ''}`,
  })
}