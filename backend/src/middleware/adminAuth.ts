import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AdminJwtPayload {
  id: string
  email: string
  isSuperAdmin: boolean
  type: string
}

// Extend Express Request to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string
        email: string
        isSuperAdmin: boolean
      }
    }
  }
}

// Verifies admin JWT
export const authenticateAdmin = (
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
    ) as AdminJwtPayload

    // Make sure this token belongs to an admin
    // not a customer who got hold of a JWT
    if (decoded.type !== 'admin') {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      isSuperAdmin: decoded.isSuperAdmin,
    }

    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Restricts to super admin only
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.admin?.isSuperAdmin) {
    res.status(403).json({
      message: 'Super admin access required'
    })
    return
  }
  next()
}