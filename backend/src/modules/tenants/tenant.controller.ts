import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';

const tenantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  phone2: z.string().optional(),
});

export async function list(req: AuthRequest, res: Response) {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) where.name = { contains: search as string };
    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { contracts: true } } },
    });
    res.json(tenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        contracts: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tenant) return res.status(404).json({ message: 'المستأجر غير موجود' });
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function search(req: AuthRequest, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 1) return res.json([]);
    const tenants = await prisma.tenant.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, phone: true, phone2: true },
      take: 10,
      orderBy: { name: 'asc' },
    });
    res.json(tenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = tenantSchema.parse(req.body);
    const tenant = await prisma.tenant.create({ data });
    res.status(201).json(tenant);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
