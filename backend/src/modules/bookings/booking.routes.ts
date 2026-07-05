import { Router } from 'express';
import { list, create, cancel, approve, reject } from './booking.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, authorize('CLIENT'), create);
router.post('/:id/cancel', authenticate, authorize('CLIENT'), cancel);
router.post('/:id/approve', authenticate, authorize('ADMIN'), approve);
router.post('/:id/reject', authenticate, authorize('ADMIN'), reject);

export default router;
