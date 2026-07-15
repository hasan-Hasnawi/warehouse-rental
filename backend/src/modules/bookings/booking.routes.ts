import { Router } from 'express';
import { list, create, cancel, approve, reject, removeBooking } from './booking.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, authorize('CLIENT'), create);
router.post('/:id/cancel', authenticate, authorize('CLIENT'), cancel);
router.post('/:id/approve', authenticate, authorize('ADMIN'), approve);
router.post('/:id/reject', authenticate, authorize('ADMIN'), reject);
router.delete('/:id', authenticate, authorize('ADMIN'), removeBooking);

export default router;
