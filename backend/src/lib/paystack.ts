import axios from 'axios'

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

export const initializeTransaction = async (
  email: string,
  amountNGN: number,
  reference: string,
  metadata: Record<string, any> = {}
) => {
  const response = await paystackClient.post('/transaction/initialize', {
    email,
    amount: Math.round(amountNGN * 100),
    reference,
    metadata,
    callback_url: process.env.PAYSTACK_CALLBACK_URL || undefined,
  })
  return response.data
}

export const verifyTransaction = async (reference: string) => {
  const response = await paystackClient.get(
    `/transaction/verify/${reference}`
  )
  return response.data
}