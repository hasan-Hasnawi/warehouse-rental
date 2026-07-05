import { Router } from 'express';
import { list, create } from './service.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, authorize('CLIENT'), create);

export default router;
