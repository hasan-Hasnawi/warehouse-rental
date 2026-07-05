import { Router } from 'express';
import { list, getById, create, update, remove } from './warehouse.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, authorize('ADMIN'), create);
router.put('/:id', authenticate, authorize('ADMIN'), update);
router.delete('/:id', authenticate, authorize('ADMIN'), remove);

export default router;
