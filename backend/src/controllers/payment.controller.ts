import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { initializeTransaction, verifyTransaction } from '../lib/paystack'
import { generatePaystackReference } from '../lib/paystackReference'
import crypto from 'crypto'

export const initializePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { orderId } = req.body

  if (!orderId) {
    res.status(400).json({ message: 'Order ID is required' })
    return
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: req.user!.id, status: 'pending' },
    include: {
      payment: true,
      customer: { select: { email: true, phoneNumber: true, fullName: true } }
    }
  })

  if (!order) {
    res.status(404).json({ message: 'Order not found or already processed' })
    return
  }

  if (!order.payment) {
    res.status(400).json({ message: 'Payment record not found for this order' })
    return
  }

  if (order.payment.paymentMethod === 'cash_on_delivery') {
    res.status(400).json({
      message: 'This order is set to cash on delivery and does not require online payment'
    })
    return
  }

  if (order.payment.paymentStatus === 'successful') {
    res.status(400).json({ message: 'This order has already been paid for' })
    return
  }

  const customerEmail = order.customer.email ||
    `${order.customer.phoneNumber}@bwarikitchen.com`

  const reference = generatePaystackReference(order.orderNumber)

  const paystackResponse = await initializeTransaction(
    customerEmail,
    Number(order.totalAmount),
    reference,
    { orderId: order.id, orderNumber: order.orderNumber, customerId: req.user!.id }
  )

  if (!paystackResponse.status) {
    res.status(500).json({ message: 'Failed to initialize payment' })
    return
  }

  await prisma.payment.update({
    where: { orderId: order.id },
    data: { providerRef: reference, paymentStatus: 'processing' }
  })

  res.status(200).json({
    message: 'Payment initialized',
    paymentUrl: paystackResponse.data.authorization_url,
    reference: paystackResponse.data.reference,
    accessCode: paystackResponse.data.access_code,
  })
}

export const verifyPaymentPublic = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reference } = req.params

  const payment = await prisma.payment.findUnique({
    where: { providerRef: reference },
    include: {
      order: {
        select: { id: true, orderNumber: true, status: true, customerId: true }
      }
    }
  })

  if (!payment) {
    res.status(404).json({ message: 'Payment not found' })
    return
  }

  if (payment.paymentStatus === 'successful') {
    res.status(200).json({
      message: 'Payment already verified',
      status: 'successful',
      orderNumber: payment.order.orderNumber,
    })
    return
  }

  const paystackResponse = await verifyTransaction(reference)

  if (!paystackResponse.status) {
    res.status(400).json({ message: 'Payment verification failed' })
    return
  }

  const paystackData = paystackResponse.data

  if (paystackData.status === 'success') {
    const paidAmountNGN = paystackData.amount / 100

    if (paidAmountNGN < Number(payment.amount)) {
      res.status(400).json({ message: 'Payment amount mismatch. Contact support.' })
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'successful', providerResponse: paystackData, paidAt: new Date() }
      })

      if (payment.order.status === 'pending') {
        await tx.order.update({
          where: { id: payment.order.id },
          data: { status: 'confirmed' }
        })

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: 'confirmed',
            note: `Payment confirmed via Paystack. Reference: ${reference}`,
          }
        })

        await tx.notification.create({
          data: {
            userId: payment.order.customerId,
            title: 'Payment Confirmed',
            body: `Payment for order ${payment.order.orderNumber} was successful.`,
            type: 'order_update',
            relatedOrderId: payment.order.id,
          }
        })
      }
    })

    res.status(200).json({
      message: 'Payment successful',
      status: 'successful',
      orderNumber: payment.order.orderNumber,
    })
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: 'failed', providerResponse: paystackData }
    })

    res.status(400).json({ message: 'Payment was not successful', status: paystackData.status })
  }
}

export const paystackWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const secret = process.env.PAYSTACK_SECRET_KEY!

  const hash = crypto
    .createHmac('sha512', secret)
    .update(req.body)
    .digest('hex')

  if (hash !== req.headers['x-paystack-signature']) {
    res.status(401).json({ message: 'Invalid signature' })
    return
  }

  const event = JSON.parse(req.body.toString())

  if (event.event === 'charge.success') {
    const reference = event.data.reference

    const payment = await prisma.payment.findUnique({
      where: { providerRef: reference },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true, customerId: true }
        }
      }
    })

    if (!payment || payment.paymentStatus === 'successful') {
      res.status(200).json({ received: true })
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'successful', providerResponse: event.data, paidAt: new Date() }
      })

      if (payment.order.status === 'pending') {
        await tx.order.update({
          where: { id: payment.order.id },
          data: { status: 'confirmed' }
        })

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: 'confirmed',
            note: `Payment confirmed via Paystack webhook. Reference: ${reference}`,
          }
        })

        await tx.notification.create({
          data: {
            userId: payment.order.customerId,
            title: 'Payment Confirmed',
            body: `Payment for order ${payment.order.orderNumber} was successful.`,
            type: 'order_update',
            relatedOrderId: payment.order.id,
          }
        })
      }
    })
  }

  res.status(200).json({ received: true })
}

export const getPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { orderId } = req.params

  const payment = await prisma.payment.findFirst({
    where: { orderId, order: { customerId: req.user!.id } },
    select: {
      paymentMethod: true,
      paymentStatus: true,
      amount: true,
      currency: true,
      providerRef: true,
      paidAt: true,
      createdAt: true,
    }
  })

  if (!payment) {
    res.status(404).json({ message: 'Payment not found' })
    return
  }

  res.status(200).json({ payment })
}