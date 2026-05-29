import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const submitReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { orderId, foodRating, deliveryRating, comment } = req.body

  if (!orderId || !foodRating) {
    res.status(400).json({ message: 'Order ID and food rating are required' })
    return
  }

  if (foodRating < 1 || foodRating > 5) {
    res.status(400).json({ message: 'Food rating must be between 1 and 5' })
    return
  }

  if (deliveryRating && (deliveryRating < 1 || deliveryRating > 5)) {
    res.status(400).json({ message: 'Delivery rating must be between 1 and 5' })
    return
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: req.user!.id,
      status: 'delivered',
    },
    select: { id: true, orderNumber: true, orderType: true, riderId: true }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found or not yet delivered' })
    return
  }

  const existingReview = await prisma.review.findUnique({ where: { orderId } })

  if (existingReview) {
    res.status(409).json({ message: 'You have already reviewed this order' })
    return
  }

  if (order.orderType === 'pickup' && deliveryRating) {
    res.status(400).json({
      message: 'Delivery rating is not applicable for pickup orders'
    })
    return
  }

  const review = await prisma.review.create({
    data: {
      orderId,
      customerId: req.user!.id,
      riderId: order.riderId || null,
      foodRating: parseFloat(foodRating),
      deliveryRating: deliveryRating ? parseFloat(deliveryRating) : null,
      comment: comment || null,
    },
    select: {
      id: true,
      foodRating: true,
      deliveryRating: true,
      comment: true,
      createdAt: true,
      order: { select: { orderNumber: true } }
    }
  })

  res.status(201).json({
    message: 'Review submitted successfully. Thank you for your feedback!',
    review,
  })
}

export const getMyReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { page = '1', limit = '10' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        foodRating: true,
        deliveryRating: true,
        comment: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
            orderType: true,
            createdAt: true,
          }
        }
      }
    }),
    prisma.review.count({ where: { customerId: req.user!.id } })
  ])

  res.status(200).json({
    reviews,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

export const checkReviewed = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { orderId } = req.params

  const review = await prisma.review.findFirst({
    where: { orderId, customerId: req.user!.id },
    select: {
      id: true,
      foodRating: true,
      deliveryRating: true,
      comment: true,
      createdAt: true,
    }
  })

  res.status(200).json({ reviewed: !!review, review: review || null })
}

export const adminGetReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { page = '1', limit = '20', rating, visible } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    ...(rating && { foodRating: parseFloat(rating as string) }),
    ...(visible !== undefined && { isVisible: visible === 'true' }),
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        foodRating: true,
        deliveryRating: true,
        comment: true,
        isVisible: true,
        createdAt: true,
        customer: { select: { fullName: true, phoneNumber: true } },
        rider: { select: { fullName: true } },
        order: { select: { orderNumber: true, orderType: true } }
      }
    }),
    prisma.review.count({ where })
  ])

  const averages = await prisma.review.aggregate({
    where: { isVisible: true },
    _avg: { foodRating: true, deliveryRating: true },
    _count: true,
  })

  res.status(200).json({
    reviews,
    averages: {
      foodRating: Math.round(Number(averages._avg.foodRating || 0) * 10) / 10,
      deliveryRating: Math.round(Number(averages._avg.deliveryRating || 0) * 10) / 10,
      totalReviews: averages._count,
    },
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

export const toggleReviewVisibility = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const review = await prisma.review.findUnique({ where: { id } })

  if (!review) {
    res.status(404).json({ message: 'Review not found' })
    return
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { isVisible: !review.isVisible },
    select: { id: true, isVisible: true, foodRating: true, comment: true }
  })

  res.status(200).json({
    message: `Review is now ${updated.isVisible ? 'visible' : 'hidden'}`,
    review: updated,
  })
}

export const adminDeleteReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const review = await prisma.review.findUnique({ where: { id } })

  if (!review) {
    res.status(404).json({ message: 'Review not found' })
    return
  }

  await prisma.review.delete({ where: { id } })
  res.status(200).json({ message: 'Review deleted successfully' })
}