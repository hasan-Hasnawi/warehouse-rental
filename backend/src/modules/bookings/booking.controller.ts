import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';
import { notifyAdmins, notifyUser } from '../notifications/notification.controller';

const createSchema = z.object({
  warehouseId: z.string(),
  message: z.string().optional(),
});

export async function list(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user!.role === 'CLIENT') where.clientId = req.user!.id;
    if (req.query.status) where.status = req.query.status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true, city: true, pricePerMonth: true } },
        client: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = createSchema.parse(req.body);

    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    if (warehouse.status !== 'VACANT') {
      return res.status(400).json({ message: 'Warehouse is not available for booking' });
    }

    const booking = await prisma.booking.create({
      data: { ...data, clientId: req.user!.id },
      include: { warehouse: true },
    });
    await logActivity({ userId: req.user!.id, action: 'CREATE_BOOKING', entity: 'Booking', entityId: booking.id });
    await notifyAdmins('طلب حجز جديد', `طلب حجز للمخزن ${booking.warehouse.name}`, 'info', `/admin/bookings`);
    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function cancel(req: AuthRequest, res: Response) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id, clientId: req.user!.id },
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
      const activeContract = await tx.contract.findFirst({
        where: { warehouseId: booking.warehouseId, status: 'ACTIVE' },
      });
      if (!activeContract) {
        await tx.warehouse.update({ where: { id: booking.warehouseId }, data: { status: 'VACANT' } });
      }
    });
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function approve(req: AuthRequest, res: Response) {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
      include: { warehouse: true, client: { select: { id: true, fullName: true } } },
    });
    await prisma.warehouse.update({ where: { id: booking.warehouse.id }, data: { status: 'MAINTENANCE' } });
    await logActivity({ userId: req.user!.id, action: 'APPROVE_BOOKING', entity: 'Booking', entityId: booking.id });
    await notifyUser(booking.clientId, 'تم قبول الحجز', `تم قبول حجز المخزن ${booking.warehouse.name}`, 'info', `/client/bookings`);
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function reject(req: AuthRequest, res: Response) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: { warehouseId: true, clientId: true },
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
      const activeContract = await tx.contract.findFirst({
        where: { warehouseId: booking.warehouseId, status: 'ACTIVE' },
      });
      if (!activeContract) {
        await tx.warehouse.update({ where: { id: booking.warehouseId }, data: { status: 'VACANT' } });
      }
    });
    await logActivity({ userId: req.user!.id, action: 'REJECT_BOOKING', entity: 'Booking', entityId: req.params.id });
    await notifyUser(booking.clientId, 'تم رفض الحجز', 'تم رفض حجز المخزن', 'alert', `/client/bookings`);
    res.json({ message: 'Booking rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function removeBooking(req: AuthRequest, res: Response) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await prisma.booking.delete({ where: { id: req.params.id } });
    await logActivity({ userId: req.user!.id, action: 'DELETE_BOOKING', entity: 'Booking', entityId: req.params.id });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
