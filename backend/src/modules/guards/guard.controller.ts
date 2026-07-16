import { Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';
import { notifyUser } from '../notifications/notification.controller';

const accessLogSchema = z.object({
  warehouseId: z.string(),
  tenantId: z.string().optional(),
  action: z.enum(['entry', 'exit', 'shipment_in', 'shipment_out']),
  notes: z.string().optional(),
});

const reportSchema = z.object({
  warehouseId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().min(5),
  severity: z.enum(['info', 'warning', 'emergency']).default('info'),
  images: z.array(z.string()).default([]),
});

const collectionSchema = z.object({
  tenantId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'ki_card', 'zaincash']).default('cash'),
  note: z.string().optional(),
});

export async function logAccess(req: AuthRequest, res: Response) {
  try {
    const data = accessLogSchema.parse(req.body);
    const log = await prisma.accessLog.create({ data: { ...data, guardId: req.user!.id } });
    res.status(201).json(log);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getAccessLogs(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user!.role === 'GUARD') where.guardId = req.user!.id;
    const logs = await prisma.accessLog.findMany({
      where,
      include: { guard: { select: { fullName: true } }, warehouse: { select: { name: true, code: true } } },
      orderBy: { timestamp: 'desc' }, take: 100,
    });
    res.json(logs);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const data = reportSchema.parse(req.body);
    const report = await prisma.guardReport.create({ data: { ...data, images: JSON.stringify(data.images), guardId: req.user!.id } });
    if (data.severity === 'emergency') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      await prisma.notification.createMany({ data: admins.map(a => ({ userId: a.id, title: 'Emergency Report', message: `${data.title}: ${data.description.substring(0, 100)}`, type: 'emergency' })) });
    }
    res.status(201).json(report);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getReports(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user!.role === 'GUARD') where.guardId = req.user!.id;
    if (req.query.severity) where.severity = req.query.severity;
    const reports = await prisma.guardReport.findMany({ where, include: { guard: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(reports);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function createCollection(req: AuthRequest, res: Response) {
  try {
    const data = collectionSchema.parse(req.body);
    const collection = await prisma.guardCollection.create({ data: { ...data, guardId: req.user!.id } });
    res.status(201).json(collection);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getCollections(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user!.role === 'GUARD') where.guardId = req.user!.id;
    if (req.query.guardId && req.user!.role === 'ADMIN') where.guardId = req.query.guardId as string;
    const collections = await prisma.guardCollection.findMany({
      where,
      include: { guard: { select: { fullName: true } }, tenant: { select: { name: true } } },
      orderBy: { collectedAt: 'desc' },
    });
    res.json(collections);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function generateQR(req: AuthRequest, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.contractId },
      include: { tenant: { select: { name: true } }, warehouse: { select: { name: true, code: true } } },
    });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    const qrData = JSON.stringify({ type: 'warehouse_access', contractId: contract.id, tenant: contract.tenant.name, warehouse: contract.warehouse.name, code: contract.warehouse.code });
    const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    res.json({ qrCode: qrImage, contract });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

const taskSchema = z.object({
  guardId: z.string(), warehouseId: z.string().optional(), title: z.string().min(2), description: z.string().optional(), priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const data = taskSchema.parse(req.body);
    const task = await prisma.guardTask.create({ data: { ...data, createdBy: req.user!.id } });
    await logActivity({ userId: req.user!.id, action: 'CREATE_TASK', entity: 'GuardTask', entityId: task.id });
    await notifyUser(data.guardId, 'مهمة جديدة', data.title, 'info');
    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.query.guardId) where.guardId = req.query.guardId as string;
    if (req.query.status) where.status = req.query.status as string;
    if (req.user!.role === 'GUARD') where.guardId = req.user!.id;
    const tasks = await prisma.guardTask.findMany({ where, include: { warehouse: { select: { id: true, name: true, code: true } }, creator: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(tasks);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

const updateTaskSchema = z.object({ status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']) });

export async function updateTaskStatus(req: AuthRequest, res: Response) {
  try {
    const { status } = updateTaskSchema.parse(req.body);
    const data: any = { status };
    if (status === 'completed') data.completedAt = new Date();
    const task = await prisma.guardTask.update({ where: { id: req.params.id }, data });
    await logActivity({ userId: req.user!.id, action: 'UPDATE_TASK', entity: 'GuardTask', entityId: task.id });
    res.json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}
