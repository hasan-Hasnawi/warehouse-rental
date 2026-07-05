import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';

export async function list(req: AuthRequest, res: Response) {
  try {
    const where: any = { userId: req.user!.id };
    if (req.query.type) where.type = req.query.type as string;
    if (req.query.isRead === 'true') where.isRead = true;
    if (req.query.isRead === 'false') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createNotification(userId: string, title: string, message: string, type: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, title, message, type, link } });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export async function notifyAdmins(title: string, message: string, type: string, link?: string) {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map(a => ({ userId: a.id, title, message, type, link })),
    });
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}

export async function notifyUser(userId: string, title: string, message: string, type: string, link?: string) {
  await createNotification(userId, title, message, type, link);
}
