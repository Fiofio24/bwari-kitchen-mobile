import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const saveCart = async (req: Request, res: Response) => {
  try {
    // Check for user ID from your auth middleware
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { cartItems } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { cartData: cartItems },
    });

    res.status(200).json({ success: true, cart: updatedUser.cartData });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ success: false, message: 'Failed to save cart to cloud' });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cartData: true },
    });

    res.status(200).json({ success: true, cart: user?.cartData || [] });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart from cloud' });
  }
};