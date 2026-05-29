import prisma from './prisma'

export const generateOrderNumber = async (): Promise<string> => {
  const count = await prisma.order.count()
  const number = String(count + 1).padStart(5, '0')
  return `BWK-${number}`
}