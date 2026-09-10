import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Get all FAQs (for both customer app and admin)
export const getFaqs = async (req: Request, res: Response) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ success: true, faqs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new FAQ (Admin only)
export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer, sortOrder, isActive } = req.body;
    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    return res.status(201).json({ success: true, faq });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update an FAQ (Admin only)
export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer, sortOrder, isActive } = req.body;
    const faq = await prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        isActive,
      },
    });
    return res.json({ success: true, faq });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an FAQ (Admin only)
export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.faq.delete({ where: { id } });
    return res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};