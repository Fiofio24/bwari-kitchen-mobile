import { Request, Response } from 'express'
import {
  calculateDeliveryFee,
  calculateDistance,
  isWithinDeliveryRadius,
} from '../lib/delivery'
import prisma from '../lib/prisma'

export const getAddresses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const addresses = await prisma.userAddress.findMany({
    where: {
      userId: req.user!.id,
      deletedAt: null,
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      label: true,
      streetAddress: true,
      landmark: true,
      area: true,
      city: true,
      latitude: true,
      longitude: true,
      isDefault: true,
      createdAt: true,
    }
  })

  res.status(200).json({ addresses })
}

export const addAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    label,
    streetAddress,
    landmark,
    area,
    city,
    latitude,
    longitude,
    isDefault,
  } = req.body

  if (!streetAddress) {
    res.status(400).json({ message: 'Street address is required' })
    return
  }

  if (isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId: req.user!.id, deletedAt: null },
      data: { isDefault: false }
    })
  }

  const existingCount = await prisma.userAddress.count({
    where: { userId: req.user!.id, deletedAt: null }
  })

  const address = await prisma.userAddress.create({
    data: {
      userId: req.user!.id,
      label: label || null,
      streetAddress,
      landmark: landmark || null,
      area: area || null,
      city: city || 'Abuja',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      isDefault: isDefault || existingCount === 0,
    },
    select: {
      id: true,
      label: true,
      streetAddress: true,
      landmark: true,
      area: true,
      city: true,
      latitude: true,
      longitude: true,
      isDefault: true,
      createdAt: true,
    }
  })

  res.status(201).json({
    message: 'Address added successfully',
    address,
  })
}

export const updateAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { label, streetAddress, landmark, area, city, latitude, longitude } = req.body

  const existing = await prisma.userAddress.findFirst({
    where: { id, userId: req.user!.id, deletedAt: null }
  })

  if (!existing) {
    res.status(404).json({ message: 'Address not found' })
    return
  }

  const address = await prisma.userAddress.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(streetAddress && { streetAddress }),
      ...(landmark !== undefined && { landmark }),
      ...(area !== undefined && { area }),
      ...(city && { city }),
      ...(latitude !== undefined && {
        latitude: latitude ? parseFloat(latitude) : null
      }),
      ...(longitude !== undefined && {
        longitude: longitude ? parseFloat(longitude) : null
      }),
    },
    select: {
      id: true,
      label: true,
      streetAddress: true,
      landmark: true,
      area: true,
      city: true,
      latitude: true,
      longitude: true,
      isDefault: true,
    }
  })

  res.status(200).json({
    message: 'Address updated successfully',
    address,
  })
}

export const setDefaultAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const address = await prisma.userAddress.findFirst({
    where: { id, userId: req.user!.id, deletedAt: null }
  })

  if (!address) {
    res.status(404).json({ message: 'Address not found' })
    return
  }

  await prisma.$transaction([
    prisma.userAddress.updateMany({
      where: { userId: req.user!.id, deletedAt: null },
      data: { isDefault: false }
    }),
    prisma.userAddress.update({
      where: { id },
      data: { isDefault: true }
    })
  ])

  res.status(200).json({ message: 'Default address updated successfully' })
}

export const deleteAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const address = await prisma.userAddress.findFirst({
    where: { id, userId: req.user!.id, deletedAt: null }
  })

  if (!address) {
    res.status(404).json({ message: 'Address not found' })
    return
  }

  await prisma.userAddress.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  if (address.isDefault) {
    const nextAddress = await prisma.userAddress.findFirst({
      where: { userId: req.user!.id, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })
    if (nextAddress) {
      await prisma.userAddress.update({
        where: { id: nextAddress.id },
        data: { isDefault: true }
      })
    }
  }

  res.status(200).json({ message: 'Address deleted successfully' })
}

export const getDeliveryFee = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { latitude, longitude, addressId } = req.body

  let deliveryLat: number
  let deliveryLon: number

  if (addressId) {
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: req.user!.id, deletedAt: null }
    })
    if (!address) {
      res.status(404).json({ message: 'Address not found' })
      return
    }
    if (!address.latitude || !address.longitude) {
      res.status(400).json({
        message: 'This address does not have GPS coordinates'
      })
      return
    }
    deliveryLat = Number(address.latitude)
    deliveryLon = Number(address.longitude)
  } else {
    if (!latitude || !longitude) {
      res.status(400).json({
        message: 'Either addressId or latitude and longitude are required'
      })
      return
    }
    deliveryLat = parseFloat(latitude)
    deliveryLon = parseFloat(longitude)
  }

  const branch = await prisma.branch.findUnique({
    where: { id: 'main-branch' },
    select: { latitude: true, longitude: true, deliveryRadiusKm: true }
  })

  if (!branch || !branch.latitude || !branch.longitude) {
    res.status(500).json({ message: 'Branch location not configured' })
    return
  }

  const feeSetting = await prisma.appSetting.findUnique({
    where: { key: 'delivery_fee_per_km' }
  })
  const feePerKm = feeSetting ? parseFloat(feeSetting.value) : 150

  const distanceKm = calculateDistance(
    Number(branch.latitude),
    Number(branch.longitude),
    deliveryLat,
    deliveryLon
  )

  const deliveryRadius = branch.deliveryRadiusKm
    ? Number(branch.deliveryRadiusKm)
    : 50

  if (!isWithinDeliveryRadius(distanceKm, deliveryRadius)) {
    res.status(400).json({
      message: `Sorry, we don't deliver to this location. Our delivery radius is ${deliveryRadius}km. You are ${distanceKm}km away.`,
      distanceKm,
      withinRadius: false,
    })
    return
  }

  const deliveryFee = calculateDeliveryFee(distanceKm, feePerKm)

  res.status(200).json({
    distanceKm,
    deliveryFee,
    feePerKm,
    withinRadius: true,
    currency: 'NGN',
  })
}