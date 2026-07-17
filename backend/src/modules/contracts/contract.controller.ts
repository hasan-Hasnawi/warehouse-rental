import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';
import { notifyAdmins } from '../notifications/notification.controller';

const contractSchema = z.object({
  tenantName: z.string().min(1),
  tenantPhone: z.string().optional(),
  tenantPhone2: z.string().optional(),
  warehouseId: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentAmount: z.number().positive(),
  discount: z.number().min(0).default(0),
  guardFeeMonthly: z.number().min(0).default(0),
  isPreAgreed: z.boolean().default(false),
  storedMaterials: z.string().optional(),
  notes: z.string().optional(),
});

async function enrichWithPayments(contracts: any[]) {
  const ids = contracts.map(c => c.id);
  const paidPayments = await prisma.payment.findMany({
    where: { contractId: { in: ids }, status: 'PAID' },
    select: { contractId: true, amount: true },
  });
  const paidMap = new Map<string, number>();
  for (const p of paidPayments) paidMap.set(p.contractId, (paidMap.get(p.contractId) || 0) + p.amount);
  return contracts.map(c => ({ ...c, paidAmount: paidMap.get(c.id) || 0, remainingAmount: Math.max(0, c.rentAmount - (paidMap.get(c.id) || 0)) }));
}

export async function list(req: AuthRequest, res: Response) {
  try {
    const { status, tenantId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;
    const contracts = await prisma.contract.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true, code: true, guardId: true, groupId: true, guard: { select: { id: true, fullName: true } }, group: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(await enrichWithPayments(contracts));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: { tenant: { select: { id: true, name: true, phone: true } }, warehouse: { include: { guard: { select: { id: true, fullName: true, phone: true } }, group: { select: { id: true, name: true, investorName: true } } } }, payments: { orderBy: { dueDate: 'asc' } } },
    });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    const paidAmount = contract.payments.filter((p: any) => p.status === 'PAID').reduce((sum: number, p: any) => sum + p.amount, 0);
    res.json({ ...contract, paidAmount, remainingAmount: Math.max(0, contract.rentAmount - paidAmount) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = contractSchema.parse(req.body);
    const activeContract = await prisma.contract.findFirst({ where: { warehouseId: data.warehouseId, status: 'ACTIVE' } });
    if (activeContract) return res.status(400).json({ message: 'المخزن لديه بالفعل عقد نشط' });
    if (!data.isPreAgreed) {
      const now = new Date();
      if (data.startDate < now) return res.status(400).json({ message: 'Start date must be in the future for new contracts' });
      const monthsDiff = (data.endDate.getFullYear() - data.startDate.getFullYear()) * 12 + (data.endDate.getMonth() - data.startDate.getMonth());
      if (monthsDiff < 6) return res.status(400).json({ message: 'Minimum contract duration is 6 months' });
    }
    const contract = await prisma.$transaction(async (tx) => {
      let tenant = await tx.tenant.findFirst({ where: { name: data.tenantName } });
      if (tenant) {
        if (data.tenantPhone && !tenant.phone) tenant = await tx.tenant.update({ where: { id: tenant.id }, data: { phone: data.tenantPhone } });
        if (data.tenantPhone2 && !tenant.phone2) tenant = await tx.tenant.update({ where: { id: tenant.id }, data: { phone2: data.tenantPhone2 } });
      } else {
        tenant = await tx.tenant.create({ data: { name: data.tenantName, phone: data.tenantPhone, phone2: data.tenantPhone2 } });
      }
      const counter = await tx.contractCounter.upsert({ where: { id: 'singleton' }, create: { id: 'singleton', nextNo: 1 }, update: { nextNo: { increment: 1 } } });
      const contractNo = `CTR-${counter.nextNo}`;
      const c = await tx.contract.create({
        data: { tenantId: tenant.id, warehouseId: data.warehouseId, startDate: data.startDate, endDate: data.endDate, rentAmount: data.rentAmount, discount: data.discount, guardFeeMonthly: data.guardFeeMonthly, isPreAgreed: data.isPreAgreed, tenantPhone: data.tenantPhone, tenantPhone2: data.tenantPhone2, storedMaterials: data.storedMaterials, notes: data.notes, contractNo, status: 'ACTIVE' },
        include: { tenant: { select: { id: true, name: true } }, warehouse: { select: { id: true, name: true, code: true } } },
      });
      await tx.warehouse.update({ where: { id: data.warehouseId }, data: { status: 'RENTED' } });
      return c;
    });
    await logActivity({ userId: req.user!.id, action: 'CREATE_CONTRACT', entity: 'Contract', entityId: contract.id });
    await notifyAdmins('عقد جديد', `تم إنشاء العقد ${contract.contractNo} للمستأجر ${contract.tenant?.name || ''}`, 'info', `/admin/contracts/${contract.id}`);
    res.status(201).json(contract);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = contractSchema.partial().parse(req.body);
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Contract not found' });
    const contract = await prisma.$transaction(async (tx) => {
      if (data.warehouseId && data.warehouseId !== existing.warehouseId) {
        const newWhActive = await tx.contract.findFirst({ where: { warehouseId: data.warehouseId, status: 'ACTIVE', id: { not: req.params.id } } });
        if (newWhActive) throw Object.assign(new Error('المخزن الجديد لديه عقد نشط بالفعل'), { status: 400 });
        const otherActive = await tx.contract.findFirst({ where: { warehouseId: existing.warehouseId, status: 'ACTIVE', id: { not: req.params.id } } });
        if (!otherActive) await tx.warehouse.update({ where: { id: existing.warehouseId }, data: { status: 'VACANT' } });
        await tx.warehouse.update({ where: { id: data.warehouseId }, data: { status: 'RENTED' } });
      }
      const updateData: any = { ...data };
      if (data.tenantName) {
        let tenant = await tx.tenant.findFirst({ where: { name: data.tenantName } });
        if (!tenant) tenant = await tx.tenant.create({ data: { name: data.tenantName, phone: data.tenantPhone, phone2: data.tenantPhone2 } });
        updateData.tenantId = tenant.id;
      }
      delete updateData.tenantName; delete updateData.tenantPhone; delete updateData.tenantPhone2;
      return tx.contract.update({ where: { id: req.params.id }, data: updateData });
    });
    await logActivity({ userId: req.user!.id, action: 'UPDATE_CONTRACT', entity: 'Contract', entityId: contract.id });
    res.json(contract);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    if ((err as any).status === 400) return res.status(400).json({ message: (err as Error).message });
    console.error(err); res.status(500).json({ message: 'Internal server error' });
  }
}

export async function terminate(req: AuthRequest, res: Response) {
  try {
    const contract = await prisma.contract.update({ where: { id: req.params.id }, data: { status: 'TERMINATED' } });
    await prisma.warehouse.update({ where: { id: contract.warehouseId }, data: { status: 'VACANT' } });
    await logActivity({ userId: req.user!.id, action: 'TERMINATE_CONTRACT', entity: 'Contract', entityId: contract.id });
    res.json({ message: 'Contract terminated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function deleteContract(req: AuthRequest, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    if (contract.status !== 'EXPIRED' && contract.status !== 'TERMINATED') return res.status(400).json({ message: 'يمكن حذف العقود المنتهية أو الملغاة فقط' });
    await prisma.payment.deleteMany({ where: { contractId: req.params.id } });
    await prisma.contract.delete({ where: { id: req.params.id } });
    await logActivity({ userId: req.user!.id, action: 'DELETE_CONTRACT', entity: 'Contract', entityId: req.params.id });
    res.json({ message: 'Contract deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function signByAdmin(req: AuthRequest, res: Response) {
  try {
    const contract = await prisma.contract.update({ where: { id: req.params.id }, data: { signedByAdmin: true } });
    res.json({ message: 'Contract signed by admin', contract });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function signByTenant(req: AuthRequest, res: Response) {
  try {
    const contract = await prisma.contract.update({ where: { id: req.params.id }, data: { signedByTenant: true } });
    res.json({ message: 'Contract signed by tenant', contract });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function getExpiring(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const expiring = await prisma.contract.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: in14Days } },
      include: { tenant: { select: { id: true, name: true, phone: true } }, warehouse: { select: { id: true, name: true, code: true } } },
      orderBy: { endDate: 'asc' },
    });
    const expired = await prisma.contract.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      include: { tenant: { select: { id: true, name: true, phone: true } }, warehouse: { select: { id: true, name: true, code: true } } },
      orderBy: { endDate: 'asc' },
    });
    res.json({ expiring, expired });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}

export async function checkExpired(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const expired = await prisma.contract.findMany({ where: { status: 'ACTIVE', endDate: { lt: now } } });
    for (const contract of expired) {
      await prisma.contract.update({ where: { id: contract.id }, data: { status: 'EXPIRED' } });
      await prisma.warehouse.update({ where: { id: contract.warehouseId }, data: { status: 'VACANT' } });
      await logActivity({ userId: req.user!.id, action: 'AUTO_EXPIRE_CONTRACT', entity: 'Contract', entityId: contract.id });
    }
    res.json({ message: `${expired.length} contracts expired`, count: expired.length });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
}
