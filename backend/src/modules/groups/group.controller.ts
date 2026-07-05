import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';

const groupSchema = z.object({
  name: z.string().min(1),
  investorName: z.string().min(1),
  description: z.string().optional(),
});

export async function list(_req: AuthRequest, res: Response) {
  try {
    const groups = await prisma.group.findMany({
      include: { _count: { select: { warehouses: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { warehouses: { include: { guard: { select: { id: true, fullName: true } } } } },
    });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = groupSchema.parse(req.body);
    const group = await prisma.group.create({ data });
    res.status(201).json(group);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = groupSchema.partial().parse(req.body);
    const group = await prisma.group.update({ where: { id: req.params.id }, data });
    res.json(group);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const count = await prisma.warehouse.count({ where: { groupId: req.params.id } });
    if (count > 0) return res.status(400).json({ message: 'Cannot delete group with existing warehouses' });
    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
