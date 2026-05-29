import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const settings = await prisma.appSetting.findMany({
    orderBy: { key: 'asc' },
    select: { id: true, key: true, value: true, description: true, updatedAt: true }
  })
  res.status(200).json({ settings })
}

export const getSetting = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { key } = req.params
  const setting = await prisma.appSetting.findUnique({ where: { key } })
  if (!setting) {
    res.status(404).json({ message: 'Setting not found' })
    return
  }
  res.status(200).json({ setting })
}

export const updateSetting = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { key } = req.params
  const { value, description } = req.body

  if (!value) {
    res.status(400).json({ message: 'Value is required' })
    return
  }

  const existing = await prisma.appSetting.findUnique({ where: { key } })
  if (!existing) {
    res.status(404).json({ message: 'Setting not found' })
    return
  }

  if (key === 'delivery_fee_per_km' || key === 'min_order_amount') {
    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
      res.status(400).json({ message: 'Value must be a positive number' })
      return
    }
  }

  if (key === 'opening_time' || key === 'closing_time') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(value)) {
      res.status(400).json({ message: 'Time must be in HH:MM format e.g. 08:00' })
      return
    }
  }

  const setting = await prisma.appSetting.update({
    where: { key },
    data: { value, ...(description !== undefined && { description }) }
  })

  res.status(200).json({ message: 'Setting updated successfully', setting })
}

export const updateMultipleSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { settings } = req.body

  if (!settings || !Array.isArray(settings) || settings.length === 0) {
    res.status(400).json({ message: 'Settings array is required' })
    return
  }

  const updated = []

  for (const item of settings) {
    if (!item.key || !item.value) {
      res.status(400).json({ message: 'Each setting must have a key and value' })
      return
    }

    const existing = await prisma.appSetting.findUnique({ where: { key: item.key } })
    if (!existing) {
      res.status(404).json({ message: `Setting '${item.key}' not found` })
      return
    }

    const result = await prisma.appSetting.update({
      where: { key: item.key },
      data: { value: item.value }
    })
    updated.push(result)
  }

  res.status(200).json({
    message: `${updated.length} setting(s) updated successfully`,
    settings: updated,
  })
}

export const createSetting = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { key, value, description } = req.body

  if (!key || !value) {
    res.status(400).json({ message: 'Key and value are required' })
    return
  }

  const keyRegex = /^[a-z_]+$/
  if (!keyRegex.test(key)) {
    res.status(400).json({ message: 'Key must contain only lowercase letters and underscores' })
    return
  }

  const existing = await prisma.appSetting.findUnique({ where: { key } })
  if (existing) {
    res.status(409).json({ message: `Setting '${key}' already exists. Use PATCH to update it.` })
    return
  }

  const setting = await prisma.appSetting.create({
    data: { key, value, description: description || null }
  })

  res.status(201).json({ message: 'Setting created successfully', setting })
}

export const getBranch = async (
  req: Request,
  res: Response
): Promise<void> => {
  const branch = await prisma.branch.findUnique({ where: { id: 'main-branch' } })
  if (!branch) {
    res.status(404).json({ message: 'Branch not found' })
    return
  }
  res.status(200).json({ branch })
}

export const updateBranch = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    name, address, landmark, area, latitude, longitude,
    phoneNumber, openingTime, closingTime, isOpen,
    acceptsPickup, acceptsDelivery, deliveryRadiusKm,
  } = req.body

  const branch = await prisma.branch.findUnique({ where: { id: 'main-branch' } })
  if (!branch) {
    res.status(404).json({ message: 'Branch not found' })
    return
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

  if (openingTime && !timeRegex.test(openingTime)) {
    res.status(400).json({ message: 'Opening time must be in HH:MM format' })
    return
  }

  if (closingTime && !timeRegex.test(closingTime)) {
    res.status(400).json({ message: 'Closing time must be in HH:MM format' })
    return
  }

  const updated = await prisma.branch.update({
    where: { id: 'main-branch' },
    data: {
      ...(name && { name }),
      ...(address && { address }),
      ...(landmark !== undefined && { landmark }),
      ...(area !== undefined && { area }),
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(openingTime && { openingTime }),
      ...(closingTime && { closingTime }),
      ...(isOpen !== undefined && { isOpen }),
      ...(acceptsPickup !== undefined && { acceptsPickup }),
      ...(acceptsDelivery !== undefined && { acceptsDelivery }),
      ...(deliveryRadiusKm && { deliveryRadiusKm: parseFloat(deliveryRadiusKm) }),
    }
  })

  res.status(200).json({ message: 'Branch updated successfully', branch: updated })
}

export const toggleRestaurantOpen = async (
  req: Request,
  res: Response
): Promise<void> => {
  const branch = await prisma.branch.findUnique({ where: { id: 'main-branch' } })

  if (!branch) {
    res.status(404).json({ message: 'Branch not found' })
    return
  }

  const updated = await prisma.branch.update({
    where: { id: 'main-branch' },
    data: { isOpen: !branch.isOpen },
    select: { id: true, name: true, isOpen: true }
  })

  res.status(200).json({
    message: `Restaurant is now ${updated.isOpen ? 'open' : 'closed'} for orders`,
    isOpen: updated.isOpen,
  })
}