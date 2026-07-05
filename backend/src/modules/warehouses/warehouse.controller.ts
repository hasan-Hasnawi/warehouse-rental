import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';
import { safeJsonParse } from '../../utils/helpers';

const warehouseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  area: z.number().positive(),
  address: z.string().min(5),
  city: z.string().min(2),
  pricePerMonth: z.number().positive(),
  pricePer6Months: z.number().positive(),
  features: z.array(z.string()).default([]),
  guardId: z.string().optional(),
  groupId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function list(req: AuthRequest, res: Response) {
  try {
    const { status, city, search, guardId, groupId, areaMin, areaMax } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (city) where.city = { contains: city as string };
    if (guardId) where.guardId = guardId as string;
    if (groupId) where.groupId = groupId as string;
    if (areaMin) where.area = { ...where.area, gte: parseFloat(areaMin as string) };
    if (areaMax) where.area = { ...where.area, lte: parseFloat(areaMax as string) };
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { code: { contains: search as string } },
      ];
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        guard: { select: { id: true, fullName: true } },
        group: { select: { id: true, name: true, investorName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const parsed = warehouses.map(w => ({
      ...w,
      features: safeJsonParse(w.features, []),
      images: safeJsonParse(w.images, []),
    }));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: {
        guard: { select: { id: true, fullName: true, email: true, phone: true } },
        group: { select: { id: true, name: true, investorName: true, description: true } },
        contracts: { where: { status: 'ACTIVE' }, include: { client: { select: { id: true, fullName: true, phone: true } } } },
      },
    });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json({
      ...warehouse,
      features: safeJsonParse(warehouse.features, []),
      images: safeJsonParse(warehouse.images, []),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = warehouseSchema.parse(req.body);
    const { features, guardId, groupId, ...rest } = data;
    const warehouse = await prisma.warehouse.create({
      data: { ...rest, guardId: guardId || null, groupId: groupId || null, features: JSON.stringify(features) },
      include: { guard: { select: { id: true, fullName: true } }, group: { select: { id: true, name: true } } },
    });
    await logActivity({ userId: req.user!.id, action: 'CREATE', entity: 'Warehouse', entityId: warehouse.id });
    res.status(201).json(warehouse);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = warehouseSchema.partial().parse(req.body);
    const { features, guardId, groupId, ...rest } = data;
    const updateData: any = { ...rest };
    if (guardId !== undefined) updateData.guardId = guardId || null;
    if (groupId !== undefined) updateData.groupId = groupId || null;
    if (features) updateData.features = JSON.stringify(features);
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: updateData,
      include: { guard: { select: { id: true, fullName: true } }, group: { select: { id: true, name: true } } },
    });
    await logActivity({ userId: req.user!.id, action: 'UPDATE', entity: 'Warehouse', entityId: warehouse.id });
    res.json(warehouse);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    await logActivity({ userId: req.user!.id, action: 'DELETE', entity: 'Warehouse', entityId: req.params.id });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
