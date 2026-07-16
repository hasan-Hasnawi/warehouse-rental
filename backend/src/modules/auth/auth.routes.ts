import { Router } from 'express';
import { login, getProfile, updateProfile, listUsers, createUserByAdmin, updateUser, deleteUser } from './auth.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/users', authenticate, authorize('ADMIN'), listUsers);
router.post('/users', authenticate, authorize('ADMIN'), createUserByAdmin);
router.put('/users/:id', authenticate, authorize('ADMIN'), updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;
