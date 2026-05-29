import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { unread, page = '1', limit = '20' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    userId: req.user!.id,
    ...(unread === 'true' && { isRead: false }),
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        isRead: true,
        relatedOrderId: true,
        createdAt: true,
      }
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: req.user!.id, isRead: false }
    })
  ])

  res.status(200).json({
    notifications,
    unreadCount,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const notification = await prisma.notification.findFirst({
    where: { id, userId: req.user!.id }
  })

  if (!notification) {
    res.status(404).json({ message: 'Notification not found' })
    return
  }

  if (notification.isRead) {
    res.status(200).json({ message: 'Notification already marked as read' })
    return
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })

  res.status(200).json({ message: 'Notification marked as read' })
}

export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true }
  })

  res.status(200).json({
    message: `${count} notification(s) marked as read`,
    count,
  })
}

export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const notification = await prisma.notification.findFirst({
    where: { id, userId: req.user!.id }
  })

  if (!notification) {
    res.status(404).json({ message: 'Notification not found' })
    return
  }

  await prisma.notification.delete({ where: { id } })
  res.status(200).json({ message: 'Notification deleted' })
}

export const deleteAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { count } = await prisma.notification.deleteMany({
    where: { userId: req.user!.id }
  })

  res.status(200).json({
    message: `${count} notification(s) deleted`,
    count,
  })
}

export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.id, isRead: false }
  })

  res.status(200).json({ unreadCount: count })
}