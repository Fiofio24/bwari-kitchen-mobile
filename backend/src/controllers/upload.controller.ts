import { Request, Response } from 'express'
import path from 'path'
import prisma from '../lib/prisma'
import supabase from '../lib/supabase'

const uploadToSupabase = async (
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, { contentType: mimeType, upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

const deleteFromSupabase = async (
  bucket: string,
  filePath: string
): Promise<void> => {
  await supabase.storage.from(bucket).remove([filePath])
}

export const uploadMenuItemImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  if (!req.file) {
    res.status(400).json({ message: 'Image file is required' })
    return
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: { id, deletedAt: null }
  })

  if (!menuItem) {
    res.status(404).json({ message: 'Menu item not found' })
    return
  }

  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
  const filePath = `menu-items/${id}${ext}`
  const imageUrl = await uploadToSupabase(
    'menu-images', filePath, req.file.buffer, req.file.mimetype
  )

  await prisma.menuItem.update({ where: { id }, data: { imageUrl } })

  res.status(200).json({
    message: 'Menu item image uploaded successfully',
    imageUrl,
  })
}

export const uploadCategoryImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  if (!req.file) {
    res.status(400).json({ message: 'Image file is required' })
    return
  }

  const category = await prisma.category.findUnique({ where: { id } })

  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
  const filePath = `categories/${id}${ext}`
  const imageUrl = await uploadToSupabase(
    'menu-images', filePath, req.file.buffer, req.file.mimetype
  )

  await prisma.category.update({ where: { id }, data: { imageUrl } })

  res.status(200).json({
    message: 'Category image uploaded successfully',
    imageUrl,
  })
}

export const uploadPackageImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  if (!req.file) {
    res.status(400).json({ message: 'Image file is required' })
    return
  }

  const pkg = await prisma.package.findFirst({ where: { id, deletedAt: null } })

  if (!pkg) {
    res.status(404).json({ message: 'Package not found' })
    return
  }

  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
  const filePath = `packages/${id}${ext}`
  const imageUrl = await uploadToSupabase(
    'menu-images', filePath, req.file.buffer, req.file.mimetype
  )

  await prisma.package.update({ where: { id }, data: { imageUrl } })

  res.status(200).json({
    message: 'Package image uploaded successfully',
    imageUrl,
  })
}

export const uploadProfilePhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'Image file is required' })
    return
  }

  const userId = req.user!.id
  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
  const filePath = `users/${userId}${ext}`
  const imageUrl = await uploadToSupabase(
    'profile-photos', filePath, req.file.buffer, req.file.mimetype
  )

  await prisma.user.update({ where: { id: userId }, data: { profilePhotoUrl: imageUrl } })

  res.status(200).json({
    message: 'Profile photo uploaded successfully',
    imageUrl,
  })
}

export const deleteMenuItemImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  const menuItem = await prisma.menuItem.findFirst({
    where: { id, deletedAt: null }
  })

  if (!menuItem) {
    res.status(404).json({ message: 'Menu item not found' })
    return
  }

  if (!menuItem.imageUrl) {
    res.status(400).json({ message: 'This menu item has no image' })
    return
  }

  const filePath = menuItem.imageUrl.split('/menu-images/')[1]
  if (filePath) await deleteFromSupabase('menu-images', filePath)

  await prisma.menuItem.update({ where: { id }, data: { imageUrl: null } })
  res.status(200).json({ message: 'Menu item image deleted successfully' })
}

export const deleteProfilePhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePhotoUrl: true }
  })

  if (!user?.profilePhotoUrl) {
    res.status(400).json({ message: 'No profile photo to delete' })
    return
  }

  const filePath = user.profilePhotoUrl.split('/profile-photos/')[1]
  if (filePath) await deleteFromSupabase('profile-photos', filePath)

  await prisma.user.update({ where: { id: userId }, data: { profilePhotoUrl: null } })
  res.status(200).json({ message: 'Profile photo deleted successfully' })
}