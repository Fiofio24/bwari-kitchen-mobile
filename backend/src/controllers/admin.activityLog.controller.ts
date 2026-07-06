import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getActivityLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    adminId, targetType, action,
    startDate, endDate,
    page = '1', limit = '30',
  } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    ...(adminId && { adminId: adminId as string }),
    ...(targetType && { targetType: targetType as string }),
    ...(action && { action: action as string }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) }),
          }
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.adminActivityLog.count({ where })
  ])

  res.status(200).json({
    logs,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  })
}

export const getDistinctAdmins = async (
  req: Request,
  res: Response
): Promise<void> => {
  const admins = await prisma.adminActivityLog.findMany({
    distinct: ['adminId'],
    select: { adminId: true, adminName: true },
    orderBy: { adminName: 'asc' },
  })

  res.status(200).json({ admins })
}