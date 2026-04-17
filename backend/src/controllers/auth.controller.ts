import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

// ─────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { fullName, phoneNumber, password, email } = req.body

  // Validate required fields
  if (!fullName || !phoneNumber || !password) {
    res.status(400).json({
      message: 'Full name, phone number, and password are required'
    })
    return
  }

  // Validate phone number format (Nigerian numbers)
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/
  if (!phoneRegex.test(phoneNumber)) {
    res.status(400).json({
      message: 'Invalid Nigerian phone number format'
    })
    return
  }

  // Validate password strength
  if (password.length < 6) {
    res.status(400).json({
      message: 'Password must be at least 6 characters'
    })
    return
  }

  // Check if phone number already exists
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber }
  })

  if (existingUser) {
    res.status(409).json({
      message: 'An account with this phone number already exists'
    })
    return
  }

  // Check email uniqueness if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })
    if (existingEmail) {
      res.status(409).json({
        message: 'An account with this email already exists'
      })
      return
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Create user and wallet in a single transaction
  const user = await prisma.user.create({
    data: {
      fullName,
      phoneNumber,
      passwordHash,
      email: email || null,
      role: 'customer',
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      role: true,
      createdAt: true,
    }
  })

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user,
  })
}

// ─────────────────────────────────────────
// CREATE STAFF ACCOUNT (Admin only)
// POST /api/auth/staff/create
// ─────────────────────────────────────────
export const createStaff = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { fullName, phoneNumber, password, role } = req.body
  
    if (!fullName || !phoneNumber || !password || !role) {
      res.status(400).json({
        message: 'Full name, phone number, password and role are required'
      })
      return
    }
  
    if (!['admin', 'rider'].includes(role)) {
      res.status(400).json({
        message: 'Role must be either admin or rider'
      })
      return
    }
  
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/
    if (!phoneRegex.test(phoneNumber)) {
      res.status(400).json({
        message: 'Invalid Nigerian phone number format'
      })
      return
    }
  
    if (password.length < 6) {
      res.status(400).json({
        message: 'Password must be at least 6 characters'
      })
      return
    }
  
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    })
  
    if (existingUser) {
      res.status(409).json({
        message: 'An account with this phone number already exists'
      })
      return
    }
  
    const passwordHash = await bcrypt.hash(password, 12)
  
    const staff = await prisma.user.create({
      data: {
        fullName,
        phoneNumber,
        passwordHash,
        role,
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      }
    })
  
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: staff,
    })
  }
  
  // ─────────────────────────────────────────
  // GET ALL USERS (Admin only)
  // GET /api/auth/users
  // ─────────────────────────────────────────
  export const getAllUsers = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { role, page = '1', limit = '20' } = req.query
  
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum
  
    const where = {
      deletedAt: null,
      ...(role && { role: role as any }),
    }
  
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ])
  
    res.status(200).json({
      users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    })
  }
  
  // ─────────────────────────────────────────
  // DEACTIVATE USER (Admin only)
  // PATCH /api/auth/users/:id/deactivate
  // ─────────────────────────────────────────
  export const deactivateUser = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params
  
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true }
    })
  
    if (!user || user.deletedAt) {
      res.status(404).json({ message: 'User not found' })
      return
    }
  
    // Prevent admin from deactivating themselves
    if (user.id === req.user!.id) {
      res.status(400).json({ message: 'You cannot deactivate your own account' })
      return
    }
  
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
  
    res.status(200).json({ message: 'User deactivated successfully' })
  }
  
  // ─────────────────────────────────────────
  // LOGOUT
  // POST /api/auth/logout
  // ─────────────────────────────────────────
  export const logout = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    // JWT is stateless — actual token removal happens on the frontend
    // This endpoint exists for consistency and future token blacklisting
    res.status(200).json({ message: 'Logged out successfully' })
  }

// ─────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber, password } = req.body

  if (!phoneNumber || !password) {
    res.status(400).json({
      message: 'Phone number and password are required'
    })
    return
  }

  // Find user by phone number
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      role: true,
      passwordHash: true,
      isActive: true,
      deletedAt: true,
    }
  })

  // Use a generic error message to prevent phone number enumeration
  if (!user || !user.passwordHash) {
    res.status(401).json({
      message: 'Invalid phone number or password'
    })
    return
  }

  // Check if account is deleted or deactivated
  if (user.deletedAt || !user.isActive) {
    res.status(403).json({
      message: 'This account has been deactivated. Please contact support.'
    })
    return
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

  if (!isPasswordValid) {
    res.status(401).json({
      message: 'Invalid phone number or password'
    })
    return
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )

  // Return user without passwordHash
  const { passwordHash: _, ...safeUser } = user

  res.status(200).json({
    message: 'Login successful',
    token,
    user: safeUser,
  })
}

// ─────────────────────────────────────────
// GET CURRENT USER
// GET /api/auth/me
// ─────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      role: true,
      profilePhotoUrl: true,
      isVerified: true,
      createdAt: true,
      wallet: {
        select: {
          balance: true,
          currency: true,
        }
      },
      addresses: {
        where: { deletedAt: null },
        select: {
          id: true,
          label: true,
          streetAddress: true,
          landmark: true,
          area: true,
          isDefault: true,
        }
      }
    }
  })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.status(200).json({ user })
}

// ─────────────────────────────────────────
// UPDATE PROFILE
// PATCH /api/auth/profile
// ─────────────────────────────────────────
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fullName, email } = req.body

  // Check email uniqueness if being updated
  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: req.user!.id }
      }
    })

    if (existingEmail) {
      res.status(409).json({
        message: 'This email is already in use by another account'
      })
      return
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      role: true,
      profilePhotoUrl: true,
    }
  })

  res.status(200).json({
    message: 'Profile updated successfully',
    user: updatedUser,
  })
}

// ─────────────────────────────────────────
// CHANGE PASSWORD
// PATCH /api/auth/change-password
// ─────────────────────────────────────────
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      message: 'Current password and new password are required'
    })
    return
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      message: 'New password must be at least 6 characters'
    })
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { passwordHash: true }
  })

  if (!user || !user.passwordHash) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  )

  if (!isCurrentPasswordValid) {
    res.status(401).json({ message: 'Current password is incorrect' })
    return
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash: newPasswordHash }
  })

  res.status(200).json({ message: 'Password changed successfully' })
}