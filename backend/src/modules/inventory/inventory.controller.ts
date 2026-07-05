import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';

const itemSchema = z.object({
  itemName: z.string().min(1),
  subName: z.string().optional(),
  quantity: z.number().int().positive(),
  description: z.string().optional(),
  warehouseId: z.string().optional(),
});

const updateSchema = z.object({
  itemName: z.string().min(1).optional(),
  subName: z.string().optional().nullable(),
  quantity: z.number().int().positive().optional(),
  description: z.string().optional(),
  warehouseId: z.string().optional().nullable(),
});

export async function list(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user!.role === 'CLIENT') {
      where.clientId = req.user!.id;
    }
    const items = await prisma.inventory.findMany({
      where,
      include: { warehouse: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = itemSchema.parse(req.body);
    const item = await prisma.inventory.create({
      data: { ...data, clientId: req.user!.id },
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = updateSchema.parse(req.body);
    const item = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.clientId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    const updated = await prisma.inventory.update({
      where: { id: req.params.id },
      data,
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const item = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.clientId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    await prisma.inventory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
