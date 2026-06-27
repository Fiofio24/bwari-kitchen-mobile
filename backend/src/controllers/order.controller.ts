import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { generateOrderNumber } from '../lib/orderNumber'
import {
  calculateDistance,
  calculateDeliveryFee,
  isWithinDeliveryRadius,
} from '../lib/delivery'

export const placeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    orderType,
    paymentMethod,
    packages,
    specialInstructions,
    scheduledFor,
    deliveryAddressId,
    streetAddress,
    landmark,
    area,
    latitude,
    longitude,
    saveAddress,
    addressLabel,
    promoCode,
  } = req.body

  // ── Validate required fields ──────────────
  if (!orderType || !paymentMethod) {
    res.status(400).json({ message: 'Order type and payment method are required' })
    return
  }

  if (!['delivery', 'pickup'].includes(orderType)) {
    res.status(400).json({ message: 'Order type must be delivery or pickup' })
    return
  }

  if (!['card', 'bank_transfer', 'ussd', 'cash_on_delivery'].includes(paymentMethod)) {
    res.status(400).json({ message: 'Invalid payment method' })
    return
  }

  if (!packages || !Array.isArray(packages) || packages.length === 0) {
    res.status(400).json({ message: 'At least one package is required' })
    return
  }

  // ── Validate scheduled time if provided ──
  let scheduledTime: Date | null = null
  if (scheduledFor) {
    scheduledTime = new Date(scheduledFor)
    if (isNaN(scheduledTime.getTime())) {
      res.status(400).json({ message: 'Invalid scheduled time format' })
      return
    }
    if (scheduledTime <= new Date()) {
      res.status(400).json({ message: 'Scheduled time must be in the future' })
      return
    }
  }

  // ── Get branch ────────────────────────────
  const branch = await prisma.branch.findUnique({ where: { id: 'main-branch' } })

  if (!branch) {
    res.status(500).json({ message: 'Branch not found. Contact support.' })
    return
  }

  if (!branch.isOpen) {
    res.status(400).json({ message: 'Restaurant is currently closed' })
    return
  }

  if (orderType === 'delivery' && !branch.acceptsDelivery) {
    res.status(400).json({ message: 'Delivery is not available at this time' })
    return
  }

  if (orderType === 'pickup' && !branch.acceptsPickup) {
    res.status(400).json({ message: 'Pickup is not available at this time' })
    return
  }

  // ── Handle delivery address ───────────────
  let resolvedAddressId: string | null = null
  let deliveryFee = 0
  let deliveryLat: number | null = null
  let deliveryLon: number | null = null

  if (orderType === 'delivery') {
    if (deliveryAddressId) {
      const savedAddress = await prisma.userAddress.findFirst({
        where: { id: deliveryAddressId, userId: req.user!.id, deletedAt: null }
      })

      if (!savedAddress) {
        res.status(404).json({ message: 'Delivery address not found' })
        return
      }

      resolvedAddressId = savedAddress.id
      deliveryLat = savedAddress.latitude ? Number(savedAddress.latitude) : null
      deliveryLon = savedAddress.longitude ? Number(savedAddress.longitude) : null

    } else if (streetAddress) {
      if (saveAddress) {
        const existingCount = await prisma.userAddress.count({
          where: { userId: req.user!.id, deletedAt: null }
        })

        const newAddress = await prisma.userAddress.create({
          data: {
            userId: req.user!.id,
            label: addressLabel || null,
            streetAddress,
            landmark: landmark || null,
            area: area || null,
            city: 'Abuja',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            isDefault: existingCount === 0,
          }
        })

        resolvedAddressId = newAddress.id
        deliveryLat = latitude ? parseFloat(latitude) : null
        deliveryLon = longitude ? parseFloat(longitude) : null
      } else {
        deliveryLat = latitude ? parseFloat(latitude) : null
        deliveryLon = longitude ? parseFloat(longitude) : null
      }
    } else {
      res.status(400).json({ message: 'A delivery address is required for delivery orders' })
      return
    }

    // ── Calculate delivery fee ──────────────
    if (deliveryLat && deliveryLon && branch.latitude && branch.longitude) {
      const distanceKm = calculateDistance(
        Number(branch.latitude),
        Number(branch.longitude),
        deliveryLat,
        deliveryLon
      )

      const radius = branch.deliveryRadiusKm ? Number(branch.deliveryRadiusKm) : 50
      if (!isWithinDeliveryRadius(distanceKm, radius)) {
        res.status(400).json({
          message: `Sorry, we don't deliver to this location. Our delivery radius is ${radius}km. You are ${distanceKm}km away.`
        })
        return
      }

      const feeSetting = await prisma.appSetting.findUnique({
        where: { key: 'delivery_fee_per_km' }
      })
      const feePerKm = feeSetting ? parseFloat(feeSetting.value) : 150
      deliveryFee = calculateDeliveryFee(distanceKm, feePerKm)
    }
  }

  // ── Validate and price packages ───────────
  let subtotal = 0
  const validatedPackages = []

  for (const pkg of packages) {
    if (!pkg.items || !Array.isArray(pkg.items) || pkg.items.length === 0) {
      res.status(400).json({ message: 'Each package must have at least one item' })
      return
    }

    let packageTotal = 0
    const validatedItems = []

    for (const item of pkg.items) {
      if (!item.menuItemId || !item.quantity || item.quantity < 1) {
        res.status(400).json({
          message: 'Each item must have a menuItemId and quantity of at least 1'
        })
        return
      }

      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: item.menuItemId,
          isAvailable: true,
          deletedAt: null,
          category: { isActive: true },
        }
      })

      if (!menuItem) {
        res.status(400).json({ message: `Menu item ${item.menuItemId} is not available` })
        return
      }

      const unitPrice = menuItem.discountPrice
        ? Number(menuItem.discountPrice)
        : Number(menuItem.basePrice)

      const itemTotal = unitPrice * item.quantity
      packageTotal += itemTotal

      validatedItems.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
      })
    }

    let packagePrice = packageTotal
    let sourcePackageId = null
    let originalPackageId = null
    let isCustom = true
    let wasEdited = false
    let packageName = pkg.name || 'Custom Package'

    if (pkg.packageId) {
      const restaurantPackage = await prisma.package.findFirst({
        where: { id: pkg.packageId, isAvailable: true, deletedAt: null }
      })

      if (restaurantPackage) {
        if (pkg.wasEdited) {
          isCustom = true
          wasEdited = true
          originalPackageId = restaurantPackage.id
          packageName = `${restaurantPackage.name} (Modified)`
        } else {
          isCustom = false
          sourcePackageId = restaurantPackage.id
          packagePrice = Number(restaurantPackage.totalPrice)
          packageName = restaurantPackage.name
        }
      }
    }

    subtotal += packagePrice

    validatedPackages.push({
      packageId: sourcePackageId,
      originalPackageId,
      packageName,
      totalPrice: packagePrice,
      isCustom,
      wasEdited,
      items: validatedItems,
    })
  }

  // ── Check minimum order amount ────────────
  const minOrderSetting = await prisma.appSetting.findUnique({
    where: { key: 'min_order_amount' }
  })
  const minOrderAmount = minOrderSetting ? parseFloat(minOrderSetting.value) : 2000

  if (subtotal < minOrderAmount) {
    res.status(400).json({
      message: `Minimum order amount is ₦${minOrderAmount.toLocaleString()}. Your subtotal is ₦${subtotal.toLocaleString()}.`
    })
    return
  }

  // ── Apply promo code if provided ──────────
  let discountAmount = 0
  let promoId: string | null = null

  if (promoCode) {
    const promo = await prisma.promotion.findUnique({
      where: { code: promoCode.toUpperCase() }
    })

    if (!promo || !promo.isActive) {
      res.status(400).json({ message: 'Invalid or inactive promo code' })
      return
    }

    const now = new Date()
    if (promo.validUntil && promo.validUntil < now) {
      res.status(400).json({ message: 'This promo code has expired' })
      return
    }

    if (promo.maxUses && promo.usesCount >= promo.maxUses) {
      res.status(400).json({ message: 'This promo code has reached its usage limit' })
      return
    }

    const userUsageCount = await prisma.promoUsage.count({
      where: { promoId: promo.id, userId: req.user!.id }
    })

    if (userUsageCount >= promo.perUserLimit) {
      res.status(400).json({
        message: 'You have already used this promo code the maximum number of times'
      })
      return
    }

    if (subtotal < Number(promo.minOrderAmount)) {
      res.status(400).json({
        message: `Minimum order amount for this code is ₦${Number(promo.minOrderAmount).toLocaleString()}`
      })
      return
    }

    switch (promo.type) {
      case 'percentage':
        discountAmount = (subtotal * Number(promo.value)) / 100
        break
      case 'fixed':
        discountAmount = Number(promo.value)
        break
      case 'free_delivery':
        discountAmount = deliveryFee
        break
      case 'bogo':
        discountAmount = subtotal * 0.5
        break
    }

    discountAmount = Math.min(discountAmount, subtotal + deliveryFee)
    discountAmount = Math.round(discountAmount * 100) / 100
    promoId = promo.id
  }

  const totalAmount = subtotal + deliveryFee - discountAmount

  // ── Create order ──────────────────────────
  const orderNumber = await generateOrderNumber()

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: req.user!.id,
        branchId: 'main-branch',
        deliveryAddressId: resolvedAddressId,
        orderType,
        status: 'pending',
        subtotal,
        deliveryFee,
        discountAmount,
        totalAmount,
        specialInstructions: specialInstructions || null,
        estimatedDeliveryTime: scheduledTime,
      }
    })

    // Create packages and items
    for (const pkg of validatedPackages) {
      const orderPackage = await tx.orderPackage.create({
        data: {
          orderId: newOrder.id,
          packageId: pkg.packageId,
          originalPackageId: pkg.originalPackageId,
          packageName: pkg.packageName,
          totalPrice: pkg.totalPrice,
          isCustom: pkg.isCustom,
          wasEdited: pkg.wasEdited,
        }
      })

      for (const item of pkg.items) {
        await tx.orderPackageItem.create({
          data: {
            orderPackageId: orderPackage.id,
            menuItemId: item.menuItemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }
        })
      }
    }

    // Record promo usage if applied
    if (promoId && discountAmount > 0) {
      await tx.promoUsage.create({
        data: {
          promoId,
          userId: req.user!.id,
          orderId: newOrder.id,
          discountApplied: discountAmount,
        }
      })

      await tx.promotion.update({
        where: { id: promoId },
        data: { usesCount: { increment: 1 } }
      })
    }

    // Log initial status
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: 'pending',
        changedById: req.user!.id,
        changedByType: 'customer',
        note: 'Order placed by customer',
      }
    })

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        userId: req.user!.id,
        amount: totalAmount,
        currency: 'NGN',
        paymentMethod: paymentMethod as any,
        paymentStatus: 'pending',
        provider: ['card', 'bank_transfer', 'ussd'].includes(paymentMethod)
          ? 'Paystack'
          : null,
      }
    })

    // Create notification
    await tx.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Order Placed',
        body: `Your order ${orderNumber} has been placed successfully.`,
        type: 'order_update',
        relatedOrderId: newOrder.id,
      }
    })

    return newOrder
  })

  // ── Fetch full order to return ────────────
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: {
      id: true,
      orderNumber: true,
      orderType: true,
      status: true,
      subtotal: true,
      deliveryFee: true,
      discountAmount: true,
      totalAmount: true,
      specialInstructions: true,
      estimatedDeliveryTime: true,
      createdAt: true,
      deliveryAddress: {
        select: { streetAddress: true, landmark: true, area: true }
      },
      orderPackages: {
        select: {
          id: true,
          packageName: true,
          totalPrice: true,
          isCustom: true,
          items: {
            select: { itemName: true, quantity: true, unitPrice: true, totalPrice: true }
          }
        }
      },
      payment: {
        select: { paymentMethod: true, paymentStatus: true, amount: true }
      }
    }
  })

  res.status(201).json({ message: 'Order placed successfully', order: fullOrder })
}

export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { status, page = '1', limit = '10' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    customerId: req.user!.id,
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
        orderType: true,
        status: true,
        subtotal: true,
        deliveryFee: true,
        totalAmount: true,
        createdAt: true,
        estimatedDeliveryTime: true,
        orderPackages: {
          select: {
            packageName: true,
            totalPrice: true,
            items: { select: { itemName: true, quantity: true } }
          }
        },
        payment: { select: { paymentMethod: true, paymentStatus: true } }
      }
    }),
    prisma.order.count({ where })
  ])

  res.status(200).json({
    orders,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  })
}

export const getOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const order = await prisma.order.findFirst({
    where: { id, customerId: req.user!.id },
    select: {
      id: true,
      orderNumber: true,
      orderType: true,
      status: true,
      subtotal: true,
      deliveryFee: true,
      discountAmount: true,
      totalAmount: true,
      specialInstructions: true,
      estimatedDeliveryTime: true,
      actualDeliveryTime: true,
      createdAt: true,
      updatedAt: true,
      deliveryAddress: {
        select: { streetAddress: true, landmark: true, area: true, city: true }
      },
      rider: { select: { id: true, fullName: true, phoneNumber: true } },
      orderPackages: {
        select: {
          id: true,
          packageName: true,
          totalPrice: true,
          isCustom: true,
          wasEdited: true,
          items: {
            select: { itemName: true, quantity: true, unitPrice: true, totalPrice: true }
          }
        }
      },
      payment: {
        select: { paymentMethod: true, paymentStatus: true, amount: true, paidAt: true }
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        select: {
          status: true,
          note: true,
          changedByType: true,   // ← replaces the relation
          createdAt: true
        }
      },
      delivery: {
        select: {
          currentLatitude: true,
          currentLongitude: true,
          estimatedArrival: true,
          lastUpdated: true,
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

export const cancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { reason } = req.body

  const order = await prisma.order.findFirst({
    where: { id, customerId: req.user!.id }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    res.status(400).json({
      message: `Order cannot be cancelled at this stage. Current status: ${order.status}`
    })
    return
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: req.user!.id,
        cancellationReason: reason || null,
      }
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'cancelled',
        changedById: req.user!.id,
        changedByType: 'customer',
        note: reason || 'Cancelled by customer',
      }
    }),
    prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Order Cancelled',
        body: `Your order ${order.orderNumber} has been cancelled.`,
        type: 'order_update',
        relatedOrderId: id,
      }
    })
  ])

  res.status(200).json({ message: 'Order cancelled successfully' })
}