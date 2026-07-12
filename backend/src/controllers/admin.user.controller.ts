import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { logActivity } from '../lib/activityLog'
import prisma from '../lib/prisma'

export const getCustomers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { search, page = '1', limit = '20' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    role: 'customer' as const,
    deletedAt: null,
    ...(search && {
      OR: [
        { fullName: { contains: search as string, mode: 'insensitive' as const } },
        { phoneNumber: { contains: search as string, mode: 'insensitive' as const } },
      ]
    }),
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true, fullName: true, phoneNumber: true, email: true,
        isActive: true, isVerified: true, createdAt: true,
        _count: { select: { orders: true } }
      }
    }),
    prisma.user.count({ where })
  ])

  res.status(200).json({
    customers,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  })
}

export const getCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const customer = await prisma.user.findFirst({
    where: { id, role: 'customer', deletedAt: null },
    select: {
      id: true, fullName: true, phoneNumber: true, email: true,
      isActive: true, isVerified: true, createdAt: true,
      addresses: {
        where: { deletedAt: null },
        select: { id: true, label: true, streetAddress: true, landmark: true, area: true, isDefault: true }
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true }
      },
      _count: { select: { orders: true } }
    }
  })

  if (!customer) {
    res.status(404).json({ message: 'Customer not found' })
    return
  }

  res.status(200).json({ customer })
}

export const getRiders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { search, page = '1', limit = '20' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    role: 'rider' as const,
    deletedAt: null,
    ...(search && {
      OR: [
        { fullName: { contains: search as string, mode: 'insensitive' as const } },
        { phoneNumber: { contains: search as string, mode: 'insensitive' as const } },
      ]
    }),
  }

  const [riders, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true, fullName: true, phoneNumber: true, email: true,
        isActive: true, isVerified: true, createdAt: true,
        _count: { select: { assignedDeliveries: true } }
      }
    }),
    prisma.user.count({ where })
  ])

  res.status(200).json({
    riders,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  })
}

export const getRider = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const rider = await prisma.user.findFirst({
    where: { id, role: 'rider', deletedAt: null },
    select: {
      id: true, fullName: true, phoneNumber: true, email: true,
      isActive: true, isVerified: true, createdAt: true,
      assignedDeliveries: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true }
      },
      _count: { select: { assignedDeliveries: true } }
    }
  })

  if (!rider) {
    res.status(404).json({ message: 'Rider not found' })
    return
  }

  res.status(200).json({ rider })
}

export const createRider = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fullName, phoneNumber, password, email } = req.body

  if (!fullName || !phoneNumber || !password) {
    res.status(400).json({ message: 'Full name, phone number and password are required' })
    return
  }

  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/
  if (!phoneRegex.test(phoneNumber)) {
    res.status(400).json({ message: 'Invalid Nigerian phone number format' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { phoneNumber } })

  if (existing) {
    res.status(409).json({ message: 'An account with this phone number already exists' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const rider = await prisma.user.create({
    data: {
      fullName, phoneNumber, passwordHash,
      email: email || null,
      role: 'rider', isVerified: true, isActive: true,
    },
    select: { id: true, fullName: true, phoneNumber: true, email: true, role: true, createdAt: true }
  })

  res.status(201).json({ message: 'Rider account created successfully', rider })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'create',
    targetType: 'Rider',
    targetId: rider.id,
    description: `Created rider account for ${rider.fullName}`,
  })
}

export const updateRider = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { fullName, phoneNumber, email } = req.body

  const rider = await prisma.user.findFirst({
    where: { id, role: 'rider', deletedAt: null }
  })

  if (!rider) {
    res.status(404).json({ message: 'Rider not found' })
    return
  }

  if (phoneNumber && phoneNumber !== rider.phoneNumber) {
    const existing = await prisma.user.findUnique({ where: { phoneNumber } })
    if (existing) {
      res.status(409).json({ message: 'Phone number already in use' })
      return
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(phoneNumber && { phoneNumber }),
      ...(email !== undefined && { email }),
    },
    select: { id: true, fullName: true, phoneNumber: true, email: true, role: true, isActive: true }
  })

  res.status(200).json({ message: 'Rider updated successfully', rider: updated })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'update',
    targetType: 'Rider',
    targetId: id,
    description: `Updated rider "${updated.fullName}"`,
  })
}

export const toggleUserActive = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, fullName: true, role: true, isActive: true }
  })

  res.status(200).json({
    message: `${updated.fullName} has been ${updated.isActive ? 'activated' : 'deactivated'}`,
    user: updated,
  })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'toggle',
    targetType: updated.role === 'rider' ? 'Rider' : 'Customer',
    targetId: id,
    description: `${updated.isActive ? 'Activated' : 'Deactivated'} ${updated.fullName}`,
  })
}

export const resetUserPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { newPassword } = req.body

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters' })
    return
  }

  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  res.status(200).json({ message: 'Password reset successfully' })
}

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false }
  })

  res.status(200).json({ message: 'User deleted successfully' })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'delete',
    targetType: 'User',
    targetId: id,
    description: `Deleted user account for ${user.fullName}`,
  })
}

export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalCustomers, newCustomersToday, totalRiders, activeRiders, inactiveUsers] =
    await Promise.all([
      prisma.user.count({ where: { role: 'customer', deletedAt: null } }),
      prisma.user.count({
        where: { role: 'customer', deletedAt: null, createdAt: { gte: today } }
      }),
      prisma.user.count({ where: { role: 'rider', deletedAt: null } }),
      prisma.user.count({ where: { role: 'rider', deletedAt: null, isActive: true } }),
      prisma.user.count({ where: { deletedAt: null, isActive: false } }),
    ])

  res.status(200).json({
    stats: {
      totalCustomers, newCustomersToday, totalRiders, activeRiders,
      inactiveRiders: totalRiders - activeRiders, inactiveUsers,
    }
  })
}