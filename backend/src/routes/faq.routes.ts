import { Router } from 'express';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faq.controller';

const router = Router();

router.get('/', getFaqs);
router.post('/', createFaq);
router.put('/:id', updateFaq);
router.delete('/:id', deleteFaq);

export default router;