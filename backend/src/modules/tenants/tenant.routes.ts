import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { list, getById, search, create } from './tenant.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), list);
router.get('/search', authenticate, authorize('ADMIN'), search);
router.get('/:id', authenticate, authorize('ADMIN'), getById);
router.post('/', authenticate, authorize('ADMIN'), create);

export default router;
