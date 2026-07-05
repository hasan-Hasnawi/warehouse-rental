import { Router } from 'express';
import { logAccess, getAccessLogs, createReport, getReports, createCollection, getCollections, generateQR, createTask, getTasks, updateTaskStatus } from './guard.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/access', authenticate, authorize('GUARD'), logAccess);
router.get('/access', authenticate, getAccessLogs);
router.post('/reports', authenticate, authorize('GUARD'), createReport);
router.get('/reports', authenticate, getReports);
router.post('/collections', authenticate, authorize('GUARD'), createCollection);
router.get('/collections', authenticate, getCollections);
router.get('/qr/:contractId', authenticate, generateQR);
router.post('/tasks', authenticate, authorize('ADMIN'), createTask);
router.get('/tasks', authenticate, getTasks);
router.put('/tasks/:id', authenticate, updateTaskStatus);

export default router;
