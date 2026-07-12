import { Request, Response } from 'express'
import { logActivity } from '../lib/activityLog'
import prisma from '../lib/prisma'
import { generatePromoCode } from '../lib/promoCode'

export const validatePromoCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code, orderAmount } = req.body

  if (!code || !orderAmount) {
    res.status(400).json({ message: 'Promo code and order amount are required' })
    return
  }

  const promo = await prisma.promotion.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!promo) {
    res.status(404).json({ message: 'Invalid promo code' })
    return
  }

  if (!promo.isActive) {
    res.status(400).json({ message: 'This promo code is no longer active' })
    return
  }

  const now = new Date()
  if (promo.validFrom && promo.validFrom > now) {
    res.status(400).json({ message: 'This promo code is not yet active' })
    return
  }

  if (promo.validUntil && promo.validUntil < now) {
    res.status(400).json({ message: 'This promo code has expired' })
    return
  }

  if (promo.maxUses && promo.usesCount >= promo.maxUses) {
    res.status(400).json({ message: 'This promo code has reached its maximum usage limit' })
    return
  }

  if (parseFloat(orderAmount) < Number(promo.minOrderAmount)) {
    res.status(400).json({
      message: `Minimum order amount for this code is ₦${Number(promo.minOrderAmount).toLocaleString()}`
    })
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

  let discountAmount = 0

  switch (promo.type) {
    case 'percentage':
      discountAmount = (parseFloat(orderAmount) * Number(promo.value)) / 100
      break
    case 'fixed':
      discountAmount = Number(promo.value)
      break
    case 'free_delivery':
      discountAmount = Number(promo.value)
      break
    case 'bogo':
      discountAmount = parseFloat(orderAmount) * 0.5
      break
  }

  discountAmount = Math.min(discountAmount, parseFloat(orderAmount))
  discountAmount = Math.round(discountAmount * 100) / 100

  res.status(200).json({
    message: 'Promo code is valid',
    promo: {
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      description: promo.description,
    },
    discountAmount,
    finalAmount: parseFloat(orderAmount) - discountAmount,
    currency: 'NGN',
  })
}

export const getActivePromos = async (
  req: Request,
  res: Response
): Promise<void> => {
  const now = new Date()

  const promos = await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      AND: [{ OR: [{ validFrom: null }, { validFrom: { lte: now } }] }]
    },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      minOrderAmount: true,
      validUntil: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  res.status(200).json({ promos })
}

export const adminGetPromos = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { page = '1', limit = '20', active } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    ...(active !== undefined && { isActive: active === 'true' }),
  }

  const [promos, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        code: true,
        description: true,
        type: true,
        value: true,
        minOrderAmount: true,
        maxUses: true,
        usesCount: true,
        perUserLimit: true,
        validFrom: true,
        validUntil: true,
        isActive: true,
        createdAt: true,
        _count: { select: { usages: true } }
      }
    }),
    prisma.promotion.count({ where })
  ])

  res.status(200).json({
    promos,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

export const adminGetPromo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const promo = await prisma.promotion.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      minOrderAmount: true,
      maxUses: true,
      usesCount: true,
      perUserLimit: true,
      validFrom: true,
      validUntil: true,
      isActive: true,
      createdAt: true,
      usages: {
        orderBy: { usedAt: 'desc' },
        take: 10,
        select: {
          discountApplied: true,
          usedAt: true,
          user: { select: { fullName: true, phoneNumber: true } },
          order: { select: { orderNumber: true, totalAmount: true } }
        }
      }
    }
  })

  if (!promo) {
    res.status(404).json({ message: 'Promo not found' })
    return
  }

  res.status(200).json({ promo })
}

export const createPromo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    description, type, value,
    minOrderAmount, maxUses, perUserLimit,
    validFrom, validUntil,
  } = req.body

  if (!type || !value) {
    res.status(400).json({ message: 'Type and value are required' })
    return
  }

  const validTypes = ['percentage', 'fixed', 'free_delivery', 'bogo']
  if (!validTypes.includes(type)) {
    res.status(400).json({ message: `Type must be one of: ${validTypes.join(', ')}` })
    return
  }

  if (type === 'percentage' && parseFloat(value) > 100) {
    res.status(400).json({ message: 'Percentage discount cannot exceed 100%' })
    return
  }

  // Auto-generate a unique code, retrying on the rare collision
  let code = generatePromoCode(type)
  let existing = await prisma.promotion.findUnique({ where: { code } })
  let attempts = 0

  while (existing && attempts < 5) {
    code = generatePromoCode(type)
    existing = await prisma.promotion.findUnique({ where: { code } })
    attempts++
  }

  if (existing) {
    res.status(500).json({ message: 'Could not generate a unique promo code. Try again.' })
    return
  }

  const promo = await prisma.promotion.create({
    data: {
      code,
      description: description || null,
      type,
      value: parseFloat(value),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxUses: maxUses ? parseInt(maxUses) : null,
      perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive: true,
    }
  })

  res.status(201).json({ message: 'Promo created successfully', promo })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'create',
    targetType: 'Promotion',
    targetId: promo.id,
    description: `Created promotion ${promo.code}`,
  })
}

export const updatePromo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const {
    description, value, minOrderAmount,
    maxUses, perUserLimit, validFrom, validUntil, isActive,
  } = req.body

  const promo = await prisma.promotion.findUnique({ where: { id } })

  if (!promo) {
    res.status(404).json({ message: 'Promo not found' })
    return
  }

  const updated = await prisma.promotion.update({
    where: { id },
    data: {
      ...(description !== undefined && { description }),
      ...(value && { value: parseFloat(value) }),
      ...(minOrderAmount !== undefined && { minOrderAmount: parseFloat(minOrderAmount) }),
      ...(maxUses !== undefined && { maxUses: maxUses ? parseInt(maxUses) : null }),
      ...(perUserLimit && { perUserLimit: parseInt(perUserLimit) }),
      ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
      ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
      ...(isActive !== undefined && { isActive }),
    }
  })

  res.status(200).json({ message: 'Promo updated successfully', promo: updated })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'update',
    targetType: 'Promotion',
    targetId: id,
    description: `Updated promotion ${updated.code}`,
  })
}

export const togglePromo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const promo = await prisma.promotion.findUnique({ where: { id } })

  if (!promo) {
    res.status(404).json({ message: 'Promo not found' })
    return
  }

  const updated = await prisma.promotion.update({
    where: { id },
    data: { isActive: !promo.isActive },
    select: { id: true, code: true, isActive: true }
  })

  res.status(200).json({
    message: `Promo ${updated.code} is now ${updated.isActive ? 'active' : 'inactive'}`,
    promo: updated,
  })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'toggle',
    targetType: 'Promotion',
    targetId: id,
    description: `${updated.isActive ? 'Activated' : 'Deactivated'} promotion ${updated.code}`,
  })
}

export const deletePromo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const promo = await prisma.promotion.findUnique({
    where: { id },
    include: { _count: { select: { usages: true } } }
  })

  if (!promo) {
    res.status(404).json({ message: 'Promo not found' })
    return
  }

  if (promo._count.usages > 0) {
    await prisma.promotion.update({ where: { id }, data: { isActive: false } })
    res.status(200).json({
      message: 'Promo has been deactivated instead of deleted to preserve usage history'
    })
    return
  }

  await prisma.promotion.delete({ where: { id } })
  res.status(200).json({ message: 'Promo deleted successfully' })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'delete',
    targetType: 'Promotion',
    targetId: id,
    description: `Deleted promotion ${promo.code}`,
  })
}