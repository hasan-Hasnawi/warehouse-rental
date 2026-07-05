import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';

const createSchema = z.object({
  warehouseId: z.string().optional(),
  serviceType: z.enum(['cleaning', 'security', 'maintenance', 'other']),
  description: z.string().min(5),
});

export async function list(req: AuthRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user!.role === 'CLIENT') where.clientId = req.user!.id;

    const services = await prisma.extraService.findMany({
      where,
      include: { client: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = createSchema.parse(req.body);
    const service = await prisma.extraService.create({
      data: { ...data, clientId: req.user!.id },
    });
    res.status(201).json(service);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
