import { Router } from 'express';
import { list, getById, create, update, remove, searchByGroup, searchByGroupPartial } from './warehouse.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.get('/search-by-group', authenticate, searchByGroup);
router.get('/search-by-group-partial', authenticate, searchByGroupPartial);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, authorize('ADMIN'), create);
router.put('/:id', authenticate, authorize('ADMIN'), update);
router.delete('/:id', authenticate, authorize('ADMIN'), remove);

export default router;
