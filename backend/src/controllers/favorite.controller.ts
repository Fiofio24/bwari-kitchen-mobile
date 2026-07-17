import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getFavorites = async (
  req: Request,
  res: Response
): Promise<void> => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      menuItem: {
        select: {
          id: true, name: true, basePrice: true, discountPrice: true,
          imageUrl: true, isAvailable: true,
          category: { select: { id: true, name: true } }
        }
      },
      package: {
        select: {
          id: true, name: true, totalPrice: true, imageUrl: true, isAvailable: true,
        }
      }
    }
  })

  res.status(200).json({ favorites })
}

export const addFavorite = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { menuItemId, packageId } = req.body

  if (!menuItemId && !packageId) {
    res.status(400).json({ message: 'menuItemId or packageId is required' })
    return
  }

  if (menuItemId && packageId) {
    res.status(400).json({ message: 'Provide only one of menuItemId or packageId' })
    return
  }

  const existing = await prisma.favorite.findFirst({
    where: {
      userId: req.user!.id,
      ...(menuItemId ? { menuItemId } : { packageId }),
    }
  })

  if (existing) {
    res.status(200).json({ message: 'Already in favorites', favorite: existing })
    return
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: req.user!.id,
      menuItemId: menuItemId || null,
      packageId: packageId || null,
    }
  })

  res.status(201).json({ message: 'Added to favorites', favorite })
}

export const removeFavorite = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { menuItemId, packageId } = req.query

  await prisma.favorite.deleteMany({
    where: {
      userId: req.user!.id,
      ...(menuItemId ? { menuItemId: menuItemId as string } : {}),
      ...(packageId ? { packageId: packageId as string } : {}),
    }
  })

  res.status(200).json({ message: 'Removed from favorites' })
}