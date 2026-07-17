import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';
import { safeJsonParse } from '../../utils/helpers';

const warehouseSchema = z.object({
  name: z.string().optional(),
  code: z.string().min(1, 'رقم المخزن مطلوب'),
  description: z.string().optional(),
  area: z.number().positive(),
  address: z.string().min(5),
  city: z.string().min(2),
  pricePerMonth: z.number().positive(),
  pricePer6Months: z.number().positive(),
  status: z.enum(['VACANT', 'RENTED', 'MAINTENANCE']).optional(),
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

    if (status === 'VACANT') {
      where.contracts = { none: { status: 'ACTIVE' } };
      where.status = { not: 'MAINTENANCE' };
    } else if (status === 'RENTED') {
      where.contracts = { some: { status: 'ACTIVE' } };
    } else if (status) {
      where.status = status;
    }
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
        _count: { select: { contracts: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const parsed = warehouses.map(({ _count, ...w }) => ({
      ...w,
      features: safeJsonParse(w.features, []),
      images: safeJsonParse(w.images, []),
      isRented: _count.contracts > 0,
      contractCount: _count.contracts,
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
        contracts: { where: { status: 'ACTIVE' }, include: { tenant: { select: { id: true, name: true, phone: true } } } },
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

    if (groupId) {
      const existing = await prisma.warehouse.findFirst({ where: { groupId, code: data.code } });
      if (existing) return res.status(400).json({ message: 'رقم المخزن مكرر ضمن هذه المجموعة' });
    }

    let name = data.name;
    if (!name && groupId) {
      const group = await prisma.group.findUnique({ where: { id: groupId } });
      name = group ? `${group.name} - ${data.code}` : data.code;
    } else if (!name) {
      name = data.code;
    }

    const warehouse = await prisma.warehouse.create({
      data: { ...rest, name, guardId: guardId || null, groupId: groupId || null, features: JSON.stringify(features) },
      include: { guard: { select: { id: true, fullName: true } }, group: { select: { id: true, name: true } } },
    });
    await logActivity({ userId: req.user!.id, action: 'CREATE', entity: 'Warehouse', entityId: warehouse.id });
    res.status(201).json(warehouse);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    if ((err as any)?.code === 'P2002') return res.status(400).json({ message: 'رقم المخزن مكرر ضمن هذه المجموعة' });
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

    const current = await prisma.warehouse.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: 'المخزن غير موجود' });

    const effectiveGroupId = groupId !== undefined ? groupId : current.groupId;
    const effectiveCode = data.code || current.code;

    if (effectiveGroupId) {
      const duplicate = await prisma.warehouse.findFirst({
        where: { groupId: effectiveGroupId, code: effectiveCode, id: { not: req.params.id } },
      });
      if (duplicate) return res.status(400).json({ message: 'رقم المخزن مكرر ضمن هذه المجموعة' });
    }

    if (data.code && data.code !== current.code) {
      if (effectiveGroupId) {
        const group = await prisma.group.findUnique({ where: { id: effectiveGroupId } });
        updateData.name = group ? `${group.name} - ${data.code}` : data.code;
      } else {
        updateData.name = data.code;
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: updateData,
      include: { guard: { select: { id: true, fullName: true } }, group: { select: { id: true, name: true } } },
    });
    await logActivity({ userId: req.user!.id, action: 'UPDATE', entity: 'Warehouse', entityId: warehouse.id });
    res.json(warehouse);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    if ((err as any)?.code === 'P2002') return res.status(400).json({ message: 'رقم المخزن مكرر ضمن هذه المجموعة' });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: { contracts: { select: { id: true, status: true } } },
    });
    if (!warehouse) return res.status(404).json({ message: 'المخزن غير موجود' });

    const activeContracts = warehouse.contracts.filter((c) => c.status === 'ACTIVE');
    if (activeContracts.length > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف المخزن لأنه يحتوي على عقود نشطة. قم بإنهاء العقود أولاً' });
    }

    await prisma.$transaction(async (tx) => {
      const contractIds = warehouse.contracts.map((c) => c.id);
      if (contractIds.length > 0) {
        await tx.payment.deleteMany({ where: { contractId: { in: contractIds } } });
        await tx.contract.deleteMany({ where: { id: { in: contractIds } } });
      }
      await tx.accessLog.updateMany({ where: { warehouseId: req.params.id }, data: { warehouseId: null } });
      await tx.guardTask.updateMany({ where: { warehouseId: req.params.id }, data: { warehouseId: null } });
      await tx.guardReport.updateMany({ where: { warehouseId: req.params.id }, data: { warehouseId: null } });
      await tx.warehouse.delete({ where: { id: req.params.id } });
    });

    await logActivity({ userId: req.user!.id, action: 'DELETE', entity: 'Warehouse', entityId: req.params.id });
    res.json({ message: 'تم حذف المخزن بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function searchByGroup(req: AuthRequest, res: Response) {
  try {
    const { groupId, code } = req.query;
    if (!groupId || !code) return res.status(400).json({ message: 'groupId and code are required' });

    const warehouse = await prisma.warehouse.findFirst({
      where: { groupId: groupId as string, code: { contains: code as string } },
      include: {
        guard: { select: { id: true, fullName: true } },
        group: { select: { id: true, name: true, investorName: true } },
      },
    });

    if (!warehouse) return res.json(null);
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

export async function searchByGroupPartial(req: AuthRequest, res: Response) {
  try {
    const { groupId, q } = req.query;
    if (!groupId || !q) return res.status(400).json({ message: 'groupId and q are required' });

    const warehouses = await prisma.warehouse.findMany({
      where: {
        groupId: groupId as string,
        code: { contains: q as string },
      },
      include: {
        guard: { select: { id: true, fullName: true } },
        group: { select: { id: true, name: true } },
      },
      take: 10,
      orderBy: { code: 'asc' },
    });

    res.json(warehouses.map(w => ({ ...w, features: safeJsonParse(w.features, []), images: safeJsonParse(w.images, []) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
