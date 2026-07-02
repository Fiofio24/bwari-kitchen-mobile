import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { logActivity } from '../lib/activityLog'

export const adminGetCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      _count: { select: { menuItems: true } }
    }
  })

  res.status(200).json({ categories })
}

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, description, imageUrl, sortOrder } = req.body

  if (!name) {
    res.status(400).json({ message: 'Category name is required' })
    return
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  })

  if (existing) {
    res.status(409).json({ message: 'A category with this name already exists' })
    return
  }

  const category = await prisma.category.create({
    data: {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      sortOrder: sortOrder || 0,
    }
  })

  res.status(201).json({ message: 'Category created successfully', category })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'create',
    targetType: 'Category',
    targetId: category.id,
    description: `Created category "${category.name}"`,
  })
}

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { name, description, imageUrl, sortOrder } = req.body

  const existing = await prisma.category.findUnique({ where: { id } })

  if (!existing) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  if (name && name !== existing.name) {
    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, NOT: { id } }
    })
    if (duplicate) {
      res.status(409).json({ message: 'A category with this name already exists' })
      return
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(sortOrder !== undefined && { sortOrder }),
    }
  })

  res.status(200).json({ message: 'Category updated successfully', category })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'update',
    targetType: 'Category',
    targetId: category.id,
    description: `Updated category "${category.name}"`,
  })
}

export const toggleCategoryAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const category = await prisma.category.findUnique({ where: { id } })

  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  const newStatus = !category.isActive

  // Cascade in both directions — deactivating turns off all items,
  // reactivating turns all items back on
  await prisma.$transaction([
    prisma.category.update({
      where: { id },
      data: { isActive: newStatus }
    }),
    prisma.menuItem.updateMany({
      where: { categoryId: id },
      data: { isAvailable: newStatus }
    })
  ])

  res.status(200).json({
    message: newStatus
      ? 'Category activated. All items in this category are now available.'
      : 'Category deactivated. All items in this category are now unavailable.',
    isActive: newStatus,
  })

  await logActivity({
    adminId: req.admin!.id,
    adminName: req.admin!.email,
    action: 'toggle',
    targetType: 'Category',
    targetId: id,
    description: `${newStatus ? 'Activated' : 'Deactivated'} category "${category.name}" (cascaded to items)`,
  })
}

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { menuItems: true } } }
  })

  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  if (category._count.menuItems > 0) {
    res.status(400).json({
      message: `Cannot delete category with ${category._count.menuItems} item(s). Move or delete the items first.`
    })
    return
  }

  await prisma.category.delete({ where: { id } })
  res.status(200).json({ message: 'Category deleted successfully' })
}

export const adminGetMenuItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { categoryId, available, page = '1', limit = '20' } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = {
    deletedAt: null,
    ...(categoryId && { categoryId: categoryId as string }),
    ...(available !== undefined && { isAvailable: available === 'true' }),
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
        isAvailable: true,
        isFeatured: true,
        preparationTime: true,
        tags: true,
        sortOrder: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      }
    }),
    prisma.menuItem.count({ where })
  ])

  res.status(200).json({
    items,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  })
}

export const createMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    categoryId, branchId, name, description,
    basePrice, discountPrice, imageUrl,
    preparationTime, isFeatured, tags, sortOrder,
  } = req.body

  if (!categoryId || !name || !basePrice) {
    res.status(400).json({ message: 'Category, name and base price are required' })
    return
  }

  if (isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
    res.status(400).json({ message: 'Base price must be a positive number' })
    return
  }

  if (discountPrice && parseFloat(discountPrice) >= parseFloat(basePrice)) {
    res.status(400).json({ message: 'Discount price must be less than base price' })
    return
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      res.status(404).json({ message: 'Branch not found' })
      return
    }
  }

  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      branchId: branchId || null,
      name,
      description: description || null,
      basePrice: parseFloat(basePrice),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      imageUrl: imageUrl || null,
      preparationTime: preparationTime ? parseInt(preparationTime) : null,
      isFeatured: isFeatured || false,
      tags: tags || [],
      sortOrder: sortOrder || 0,
    },
    select: {
      id: true, name: true, description: true, basePrice: true,
      discountPrice: true, imageUrl: true, isAvailable: true,
      isFeatured: true, preparationTime: true, tags: true, sortOrder: true,
      category: { select: { id: true, name: true } },
    }
  })

  res.status(201).json({ message: 'Menu item created successfully', item })
}

export const updateMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const {
    categoryId, name, description, basePrice, discountPrice,
    imageUrl, preparationTime, isFeatured, tags, sortOrder,
  } = req.body

  const existing = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } })

  if (!existing) {
    res.status(404).json({ message: 'Menu item not found' })
    return
  }

  const newBasePrice = basePrice ? parseFloat(basePrice) : Number(existing.basePrice)
  const newDiscountPrice = discountPrice ? parseFloat(discountPrice) : null

  if (newDiscountPrice && newDiscountPrice >= newBasePrice) {
    res.status(400).json({ message: 'Discount price must be less than base price' })
    return
  }

  if (categoryId && categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      res.status(404).json({ message: 'Category not found' })
      return
    }
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(categoryId && { categoryId }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(basePrice && { basePrice: parseFloat(basePrice) }),
      ...(discountPrice !== undefined && {
        discountPrice: discountPrice ? parseFloat(discountPrice) : null
      }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(preparationTime !== undefined && {
        preparationTime: preparationTime ? parseInt(preparationTime) : null
      }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(tags !== undefined && { tags }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    select: {
      id: true, name: true, description: true, basePrice: true,
      discountPrice: true, imageUrl: true, isAvailable: true,
      isFeatured: true, preparationTime: true, tags: true, sortOrder: true,
      category: { select: { id: true, name: true } },
    }
  })

  res.status(200).json({ message: 'Menu item updated successfully', item })
}

export const toggleItemAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } })

  if (!item) {
    res.status(404).json({ message: 'Menu item not found' })
    return
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !item.isAvailable },
    select: { id: true, name: true, isAvailable: true }
  })

  res.status(200).json({
    message: `${updated.name} is now ${updated.isAvailable ? 'available' : 'unavailable'}`,
    item: updated,
  })
}

export const deleteMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } })

  if (!item) {
    res.status(404).json({ message: 'Menu item not found' })
    return
  }

  await prisma.menuItem.update({
    where: { id },
    data: { deletedAt: new Date(), isAvailable: false }
  })

  res.status(200).json({ message: 'Menu item deleted successfully' })
}

export const adminGetPackages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const packages = await prisma.package.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, name: true, description: true, imageUrl: true,
      totalPrice: true, isAvailable: true, isFeatured: true,
      tags: true, sortOrder: true, createdAt: true,
      items: {
        select: {
          quantity: true,
          menuItem: { select: { id: true, name: true, basePrice: true, imageUrl: true } }
        }
      }
    }
  })

  res.status(200).json({ packages })
}

export const createPackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    name, description, imageUrl, totalPrice,
    isFeatured, tags, sortOrder, items,
  } = req.body

  if (!name || !totalPrice) {
    res.status(400).json({ message: 'Package name and total price are required' })
    return
  }

  if (isNaN(parseFloat(totalPrice)) || parseFloat(totalPrice) <= 0) {
    res.status(400).json({ message: 'Total price must be a positive number' })
    return
  }

  if (items && items.length > 0) {
    for (const item of items) {
      if (!item.menuItemId || !item.quantity) {
        res.status(400).json({ message: 'Each package item must have a menuItemId and quantity' })
        return
      }
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: item.menuItemId, deletedAt: null }
      })
      if (!menuItem) {
        res.status(404).json({ message: `Menu item ${item.menuItemId} not found` })
        return
      }
    }
  }

  const pkg = await prisma.package.create({
    data: {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      totalPrice: parseFloat(totalPrice),
      isFeatured: isFeatured || false,
      tags: tags || [],
      sortOrder: sortOrder || 0,
      items: items && items.length > 0 ? {
        create: items.map((item: { menuItemId: string; quantity: number }) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        }))
      } : undefined,
    },
    select: {
      id: true, name: true, description: true, imageUrl: true,
      totalPrice: true, isAvailable: true, isFeatured: true, tags: true,
      items: {
        select: {
          quantity: true,
          menuItem: { select: { id: true, name: true, basePrice: true } }
        }
      }
    }
  })

  res.status(201).json({ message: 'Package created successfully', package: pkg })
}

export const updatePackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { name, description, imageUrl, totalPrice, isFeatured, tags, sortOrder, items } = req.body

  const existing = await prisma.package.findFirst({ where: { id, deletedAt: null } })

  if (!existing) {
    res.status(404).json({ message: 'Package not found' })
    return
  }

  if (totalPrice && (isNaN(parseFloat(totalPrice)) || parseFloat(totalPrice) <= 0)) {
    res.status(400).json({ message: 'Total price must be a positive number' })
    return
  }

  const pkg = await prisma.package.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(totalPrice && { totalPrice: parseFloat(totalPrice) }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(tags !== undefined && { tags }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(items && {
        items: {
          deleteMany: {},
          create: items.map((item: { menuItemId: string; quantity: number }) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          }))
        }
      }),
    },
    select: {
      id: true, name: true, description: true, totalPrice: true,
      isAvailable: true, isFeatured: true, tags: true,
      items: {
        select: {
          quantity: true,
          menuItem: { select: { id: true, name: true, basePrice: true } }
        }
      }
    }
  })

  res.status(200).json({ message: 'Package updated successfully', package: pkg })
}

export const togglePackageAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const pkg = await prisma.package.findFirst({ where: { id, deletedAt: null } })

  if (!pkg) {
    res.status(404).json({ message: 'Package not found' })
    return
  }

  const updated = await prisma.package.update({
    where: { id },
    data: { isAvailable: !pkg.isAvailable },
    select: { id: true, name: true, isAvailable: true }
  })

  res.status(200).json({
    message: `${updated.name} is now ${updated.isAvailable ? 'available' : 'unavailable'}`,
    package: updated,
  })
}

export const deletePackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const pkg = await prisma.package.findFirst({ where: { id, deletedAt: null } })

  if (!pkg) {
    res.status(404).json({ message: 'Package not found' })
    return
  }

  await prisma.package.update({
    where: { id },
    data: { deletedAt: new Date(), isAvailable: false }
  })

  res.status(200).json({ message: 'Package deleted successfully' })
}