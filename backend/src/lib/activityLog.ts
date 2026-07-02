import prisma from './prisma'

interface LogParams {
  adminId: string
  adminName: string
  action: string
  targetType: string
  targetId?: string
  description: string
}

export const logActivity = async (params: LogParams): Promise<void> => {
  try {
    await prisma.adminActivityLog.create({ data: params })
  } catch (err) {
    // Never let logging failure break the actual operation
    console.error('Failed to log admin activity:', err)
  }
}