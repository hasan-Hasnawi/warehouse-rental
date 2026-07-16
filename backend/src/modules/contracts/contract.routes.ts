import { Router } from 'express';
import { list, getById, create, update, terminate, deleteContract, signByAdmin, signByTenant, getExpiring, checkExpired } from './contract.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.get('/expiring', authenticate, authorize('ADMIN'), getExpiring);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, authorize('ADMIN'), create);
router.put('/:id', authenticate, authorize('ADMIN'), update);
router.post('/:id/terminate', authenticate, authorize('ADMIN'), terminate);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteContract);
router.post('/:id/sign-admin', authenticate, authorize('ADMIN'), signByAdmin);
router.post('/:id/sign-tenant', authenticate, authorize('ADMIN'), signByTenant);
router.post('/check-expired', authenticate, authorize('ADMIN'), checkExpired);

export default router;
