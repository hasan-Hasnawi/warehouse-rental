import { Router } from 'express';
import { list, create, getById, getDashboard, getMethods, initiatePayment, markAsPaid } from './payment.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.get('/dashboard', authenticate, authorize('ADMIN'), getDashboard);
router.get('/methods', authenticate, getMethods);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.post('/pay', authenticate, initiatePayment);
router.post('/:id/mark-paid', authenticate, authorize('ADMIN'), markAsPaid);

export default router;
