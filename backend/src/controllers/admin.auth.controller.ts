import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { logActivity } from '../lib/activityLog'

// ─────────────────────────────────────────
// ADMIN LOGIN
// POST /api/admin/auth/login
// ─────────────────────────────────────────
export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({
      message: 'Email and password are required'
    })
    return
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email }
  })

  if (!admin || !admin.isActive || admin.deletedAt) {
    res.status(401).json({
      message: 'Invalid email or password'
    })
    return
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash)

  if (!isPasswordValid) {
    res.status(401).json({
      message: 'Invalid email or password'
    })
    return
  }

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
      type: 'admin'          // ← marks this as an admin token
    },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }     // ← shorter expiry for admin sessions
  )

  res.status(200).json({
    message: 'Login successful',
    token,
    admin: {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
    }
  })

  await logActivity({
    adminId: admin.id,
    adminName: admin.email,
    action: 'login',
    targetType: 'AdminUser',
    targetId: admin.id,
    description: `Logged in`,
  })
}

// ─────────────────────────────────────────
// CREATE ADMIN (Super admin only)
// POST /api/admin/auth/create
// ─────────────────────────────────────────
export const createAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fullName, email, password, isSuperAdmin } = req.body

  if (!fullName || !email || !password) {
    res.status(400).json({
      message: 'Full name, email and password are required'
    })
    return
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } })

  if (existing) {
    res.status(409).json({
      message: 'An admin with this email already exists'
    })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.adminUser.create({
    data: {
      fullName,
      email,
      passwordHash,
      isSuperAdmin: isSuperAdmin || false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      isSuperAdmin: true,
      createdAt: true,
    }
  })

  res.status(201).json({
    message: 'Admin account created successfully',
    admin,
  })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'create',
    targetType: 'AdminUser',
    targetId: admin.id,
    description: `Created admin account for ${admin.fullName}`,
})
}

// ─────────────────────────────────────────
// GET ADMIN PROFILE
// GET /api/admin/auth/me
// ─────────────────────────────────────────
export const getAdminMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.admin!.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      isSuperAdmin: true,
      createdAt: true,
    }
  })

  if (!admin) {
    res.status(404).json({ message: 'Admin not found' })
    return
  }

  res.status(200).json({ admin })
}

// ─────────────────────────────────────────
// CHANGE ADMIN PASSWORD
// PATCH /api/admin/auth/change-password
// ─────────────────────────────────────────
export const changeAdminPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      message: 'Current and new password are required'
    })
    return
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      message: 'New password must be at least 6 characters'
    })
    return
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: req.admin!.id },
    select: { passwordHash: true }
  })

  if (!admin) {
    res.status(404).json({ message: 'Admin not found' })
    return
  }

  const isValid = await bcrypt.compare(currentPassword, admin.passwordHash)

  if (!isValid) {
    res.status(401).json({ message: 'Current password is incorrect' })
    return
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12)

  await prisma.adminUser.update({
    where: { id: req.admin!.id },
    data: { passwordHash: newPasswordHash }
  })

  res.status(200).json({ message: 'Password changed successfully' })
}