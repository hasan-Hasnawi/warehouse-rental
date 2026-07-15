import { Router } from 'express';
import { list, getUnreadCount, markAsRead, markAllAsRead, deleteNotifications } from './notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, list);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);
router.post('/delete', authenticate, deleteNotifications);

export default router;
