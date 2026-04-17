import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

interface JwtPayload {
  id: string
  role: UserRole
  phoneNumber: string
}

// Verifies JWT and attaches user to req.user
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload

    req.user = {
      id: decoded.id,
      role: decoded.role,
      phoneNumber: decoded.phoneNumber,
    }

    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Restricts route to specific roles
// Usage: authorize('admin') or authorize('admin', 'rider')
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    next()
  }
}