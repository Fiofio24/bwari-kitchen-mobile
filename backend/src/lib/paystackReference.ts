export const generatePaystackReference = (orderNumber: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BWK-PAY-${orderNumber}-${timestamp}-${random}`
}