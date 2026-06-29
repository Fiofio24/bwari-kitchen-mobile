import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getMyDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { status, page = '1', limit = '10' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    riderId: req.user!.id,
    orderType: 'delivery' as const,
    ...(status && { status: status as any }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        specialInstructions: true,
        estimatedDeliveryTime: true,
        createdAt: true,
        customer: {
          select: { fullName: true, phoneNumber: true }
        },
        deliveryAddress: {
          select: {
            streetAddress: true,
            landmark: true,
            area: true,
            city: true,
            latitude: true,
            longitude: true,
          }
        },
        orderPackages: {
          select: {
            packageName: true,
            items: {
              select: { itemName: true, quantity: true }
            }
          }
        },
        delivery: {
          select: {
            pickupTime: true,
            estimatedArrival: true,
            lastUpdated: true,
          }
        }
      }
    }),
    prisma.order.count({ where })
  ])

  res.status(200).json({
    orders,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

export const getDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const order = await prisma.order.findFirst({
    where: { id, riderId: req.user!.id, orderType: 'delivery' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      specialInstructions: true,
      estimatedDeliveryTime: true,
      createdAt: true,
      customer: {
        select: { fullName: true, phoneNumber: true }
      },
      deliveryAddress: {
        select: {
          streetAddress: true,
          landmark: true,
          area: true,
          city: true,
          latitude: true,
          longitude: true,
        }
      },
      orderPackages: {
        select: {
          packageName: true,
          items: {
            select: { itemName: true, quantity: true, unitPrice: true }
          }
        }
      },
      payment: {
        select: { paymentMethod: true, paymentStatus: true, amount: true }
      },
      delivery: {
        select: {
          currentLatitude: true,
          currentLongitude: true,
          pickupTime: true,
          estimatedArrival: true,
          lastUpdated: true,
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        select: { status: true, note: true, createdAt: true }
      }
    }
  })

  if (!order) {
    res.status(404).json({ message: 'Delivery not found' })
    return
  }

  res.status(200).json({ order })
}

export const updateDeliveryStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { status, note } = req.body

  const allowedStatuses = ['picked_up', 'on_the_way', 'delivered']

  if (!status || !allowedStatuses.includes(status)) {
    res.status(400).json({
      message: `Invalid status. Rider can only set: ${allowedStatuses.join(', ')}`
    })
    return
  }

  const order = await prisma.order.findFirst({
    where: { id, riderId: req.user!.id, orderType: 'delivery' },
    select: { id: true, orderNumber: true, status: true, customerId: true }
  })

  if (!order) {
    res.status(404).json({ message: 'Delivery not found' })
    return
  }

  const statusFlow: Record<string, string> = {
    ready: 'picked_up',
    picked_up: 'on_the_way',
    on_the_way: 'delivered',
  }

  if (statusFlow[order.status] !== status) {
    res.status(400).json({
      message: `Cannot set status to ${status}. Current status is ${order.status}. Expected next status: ${statusFlow[order.status] || 'none'}`
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

    await tx.deliveryTracking.update({
      where: { orderId: id },
      data: {
        ...(status === 'picked_up' && { pickupTime: new Date() }),
        lastUpdated: new Date(),
      }
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        changedById: req.user!.id,
        changedByType: 'rider',
        note: note || null,
      }
    })

    const statusMessages: Record<string, string> = {
      picked_up: `Your order ${order.orderNumber} has been picked up and is on its way.`,
      on_the_way: `Your order ${order.orderNumber} is on the way to you.`,
      delivered: `Your order ${order.orderNumber} has been delivered. Enjoy your meal!`,
    }

    await tx.notification.create({
      data: {
        userId: order.customerId,
        title: status === 'delivered' ? '🍽️ Order Delivered!' : '🛵 Order Update',
        body: statusMessages[status],
        type: 'order_update',
        relatedOrderId: id,
      }
    })

    if (status === 'delivered') {
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'How was your order?',
          body: `Rate your experience for order ${order.orderNumber}.`,
          type: 'review_request',
          relatedOrderId: id,
        }
      })
    }
  })

  res.status(200).json({
    message: `Delivery status updated to ${status}`,
    orderNumber: order.orderNumber,
    status,
  })
}

export const updateRiderLocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { latitude, longitude, estimatedArrival } = req.body

  if (!latitude || !longitude) {
    res.status(400).json({ message: 'Latitude and longitude are required' })
    return
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      riderId: req.user!.id,
      orderType: 'delivery',
      status: { in: ['picked_up', 'on_the_way'] },
    },
    select: { id: true }
  })

  if (!order) {
    res.status(404).json({ message: 'Active delivery not found' })
    return
  }

  await prisma.deliveryTracking.update({
    where: { orderId: id },
    data: {
      currentLatitude: parseFloat(latitude),
      currentLongitude: parseFloat(longitude),
      lastUpdated: new Date(),
      ...(estimatedArrival && { estimatedArrival: new Date(estimatedArrival) }),
    }
  })

  res.status(200).json({ message: 'Location updated' })
}

export const getRiderStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalDeliveries, todayDeliveries, activeDeliveries, cancelledDeliveries] =
    await Promise.all([
      prisma.order.count({ where: { riderId: req.user!.id, status: 'delivered' } }),
      prisma.order.count({
        where: {
          riderId: req.user!.id,
          status: 'delivered',
          actualDeliveryTime: { gte: today },
        }
      }),
      prisma.order.count({
        where: {
          riderId: req.user!.id,
          status: { in: ['picked_up', 'on_the_way'] },
        }
      }),
      prisma.order.count({ where: { riderId: req.user!.id, status: 'cancelled' } }),
    ])

  res.status(200).json({
    stats: { totalDeliveries, todayDeliveries, activeDeliveries, cancelledDeliveries }
  })
}

export const getRiderProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rider = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      profilePhotoUrl: true,
      isVerified: true,
      createdAt: true,
    }
  })

  if (!rider) {
    res.status(404).json({ message: 'Rider not found' })
    return
  }

  res.status(200).json({ rider })
}