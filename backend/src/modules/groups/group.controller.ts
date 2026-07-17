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
      include: {
        _count: { select: { warehouses: true } },
        warehouses: {
          include: {
            guard: { select: { id: true, fullName: true } },
            contracts: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                rentAmount: true,
                startDate: true,
                endDate: true,
                status: true,
                tenant: { select: { id: true, name: true, phone: true } },
              },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const enriched = groups.map((g) => {
      const totalWarehouses = g._count.warehouses;
      const rentedWarehouses = g.warehouses.filter((w) => w.contracts.some((c) => c.status === 'ACTIVE')).length;
      const totalRevenue = g.warehouses.reduce((sum, w) => {
        const activeContract = w.contracts.find((c) => c.status === 'ACTIVE');
        return sum + (activeContract?.rentAmount || 0);
      }, 0);
      const expiringCount = g.warehouses.filter((w) =>
        w.contracts.some((c) => c.status === 'ACTIVE' && c.endDate >= now && c.endDate <= in14Days)
      ).length;
      const expiredCount = g.warehouses.filter((w) =>
        w.contracts.some((c) => c.status === 'ACTIVE' && c.endDate < now)
      ).length;

      const warehouses = g.warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        area: w.area,
        city: w.city,
        status: w.status,
        pricePer6Months: w.pricePer6Months,
        guard: w.guard,
        activeContract: w.contracts[0] || null,
      }));

      return {
        id: g.id,
        name: g.name,
        investorName: g.investorName,
        description: g.description,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        totalWarehouses,
        rentedWarehouses,
        vacantWarehouses: totalWarehouses - rentedWarehouses,
        occupancyRate: totalWarehouses > 0 ? Math.round((rentedWarehouses / totalWarehouses) * 100) : 0,
        totalRevenue,
        expiringCount,
        expiredCount,
        warehouses,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        warehouses: {
          include: {
            guard: { select: { id: true, fullName: true, phone: true } },
            contracts: {
              where: { status: 'ACTIVE' },
              include: {
                tenant: { select: { id: true, name: true, phone: true } },
              },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const totalWarehouses = group.warehouses.length;
    const rentedWarehouses = group.warehouses.filter((w) => w.contracts.some((c) => c.status === 'ACTIVE')).length;
    const totalRevenue = group.warehouses.reduce((sum, w) => {
      const activeContract = w.contracts.find((c) => c.status === 'ACTIVE');
      return sum + (activeContract?.rentAmount || 0);
    }, 0);

    res.json({
      ...group,
      totalWarehouses,
      rentedWarehouses,
      vacantWarehouses: totalWarehouses - rentedWarehouses,
      occupancyRate: totalWarehouses > 0 ? Math.round((rentedWarehouses / totalWarehouses) * 100) : 0,
      totalRevenue,
    });
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
