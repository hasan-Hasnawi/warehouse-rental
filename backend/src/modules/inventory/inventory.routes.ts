import { Router } from 'express';
import { list, create, update, remove } from './inventory.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

export default router;
