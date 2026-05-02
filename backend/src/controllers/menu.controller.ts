import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// ─────────────────────────────────────────
// GET ALL CATEGORIES
// GET /api/menu/categories
// ─────────────────────────────────────────
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      sortOrder: true,
    }
  })

  res.status(200).json({ categories })
}

// ─────────────────────────────────────────
// GET ALL MENU ITEMS
// GET /api/menu/items
// Query params:
//   ?categoryId=uuid
//   ?featured=true
//   ?search=egusi
//   ?page=1&limit=20
// ─────────────────────────────────────────
export const getMenuItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    categoryId,
    featured,
    search,
    page = '1',
    limit = '20'
  } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    isAvailable: true,
    deletedAt: null,
    category: {
      isActive: true,
    },
    ...(categoryId && { categoryId: categoryId as string }),
    ...(featured === 'true' && { isFeatured: true }),
    ...(search && {
      name: {
        contains: search as string,
        mode: 'insensitive' as const,
      }
    }),
  }

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        discountPrice: true,
        imageUrl: true,
        isFeatured: true,
        preparationTime: true,
        tags: true,
        sortOrder: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    }),
    prisma.menuItem.count({ where })
  ])

  res.status(200).json({
    items,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

// ─────────────────────────────────────────
// GET SINGLE MENU ITEM
// GET /api/menu/items/:id
// ─────────────────────────────────────────
export const getMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const item = await prisma.menuItem.findFirst({
    where: {
      id,
      isAvailable: true,
      deletedAt: null,
      category: {
        isActive: true,
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      basePrice: true,
      discountPrice: true,
      imageUrl: true,
      isFeatured: true,
      preparationTime: true,
      tags: true,
      category: {
        select: {
          id: true,
          name: true,
        }
      },
      branch: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  })

  if (!item) {
    res.status(404).json({ message: 'Menu item not found' })
    return
  }

  res.status(200).json({ item })
}

// ─────────────────────────────────────────
// GET ALL PACKAGES
// GET /api/menu/packages
// Query params:
//   ?featured=true
// ─────────────────────────────────────────
export const getPackages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { featured } = req.query

  const packages = await prisma.package.findMany({
    where: {
      isAvailable: true,
      deletedAt: null,
      ...(featured === 'true' && { isFeatured: true }),
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      totalPrice: true,
      isFeatured: true,
      tags: true,
      items: {
        select: {
          quantity: true,
          menuItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              discountPrice: true,
              imageUrl: true,
              category: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      }
    }
  })

  res.status(200).json({ packages })
}

// ─────────────────────────────────────────
// GET SINGLE PACKAGE
// GET /api/menu/packages/:id
// ─────────────────────────────────────────
export const getPackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const pkg = await prisma.package.findFirst({
    where: {
      id,
      isAvailable: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      totalPrice: true,
      isFeatured: true,
      tags: true,
      items: {
        select: {
          quantity: true,
          menuItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              discountPrice: true,
              imageUrl: true,
              category: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      }
    }
  })

  if (!pkg) {
    res.status(404).json({ message: 'Package not found' })
    return
  }

  res.status(200).json({ package: pkg })
}

// ─────────────────────────────────────────
// GET FULL MENU
// GET /api/menu
// Returns categories with their items,
// featured items, and featured packages
// in a single request
// ─────────────────────────────────────────
export const getFullMenu = async (
  req: Request,
  res: Response
): Promise<void> => {
  const [categories, featuredItems, featuredPackages] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        sortOrder: true,
        menuItems: {
          where: {
            isAvailable: true,
            deletedAt: null,
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            discountPrice: true,
            imageUrl: true,
            isFeatured: true,
            preparationTime: true,
            tags: true,
          }
        }
      }
    }),

    prisma.menuItem.findMany({
      where: {
        isFeatured: true,
        isAvailable: true,
        deletedAt: null,
        category: { isActive: true },
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        discountPrice: true,
        imageUrl: true,
        tags: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    }),

    prisma.package.findMany({
      where: {
        isFeatured: true,
        isAvailable: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        totalPrice: true,
        tags: true,
      }
    }),
  ])

  res.status(200).json({
    categories,
    featuredItems,
    featuredPackages,
  })
}

// ─────────────────────────────────────────
// GET BRANCH INFO
// GET /api/menu/branch
// Always returns branch info regardless
// of open/closed status
// ─────────────────────────────────────────
export const getBranchInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const branch = await prisma.branch.findFirst({
    select: {
      id: true,
      name: true,
      address: true,
      landmark: true,
      area: true,
      latitude: true,
      longitude: true,
      phoneNumber: true,
      openingTime: true,
      closingTime: true,
      isOpen: true,
      acceptsPickup: true,
      acceptsDelivery: true,
      deliveryRadiusKm: true,
    }
  })

  if (!branch) {
    res.status(404).json({ message: 'No branch found' })
    return
  }

  res.status(200).json({ branch })
}