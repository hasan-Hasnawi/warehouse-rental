import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';
import { notifyAdmins, notifyUser } from '../notifications/notification.controller';
import { processPayment, getPaymentMethods } from './payment-gateway';

const paymentSchema = z.object({
  contractId: z.string(),
  amount: z.number().positive(),
  method: z.enum(['ki_card', 'zaincash', 'cash', 'bank']),
  dueDate: z.coerce.date(),
  description: z.string().optional(),
});

export async function list(req: AuthRequest, res: Response) {
  try {
    const { contractId, status } = req.query;
    const where: any = {};
    if (contractId) where.contractId = contractId;
    if (status) where.status = status;
    if (req.user!.role === 'CLIENT') where.clientId = req.user!.id;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        contract: { select: { contractNo: true } },
        client: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { contract: { include: { warehouse: true } }, client: true },
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = paymentSchema.parse(req.body);

    // Check for overpayment against contract
    const contract = await prisma.contract.findUnique({ where: { id: data.contractId } });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const paidPayments = await prisma.payment.findMany({
      where: { contractId: data.contractId, status: 'PAID' },
      select: { amount: true },
    });
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid + data.amount > contract.rentAmount) {
      return res.status(400).json({
        message: `المبلغ يتجاوز المتبقي من العقد. المتبقي: ${Math.max(0, contract.rentAmount - totalPaid)}`,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        ...data,
        clientId: req.user!.role === 'ADMIN' ? contract.clientId : req.user!.id,
        status: 'PENDING',
      },
    });
    await logActivity({ userId: req.user!.id, action: 'CREATE_PAYMENT', entity: 'Payment', entityId: payment.id });
    res.status(201).json(payment);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function markAsPaid(req: AuthRequest, res: Response) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot mark a ${payment.status.toLowerCase()} payment as paid` });
    }

    // Check for overpayment
    const paidPayments = await prisma.payment.findMany({
      where: { contractId: payment.contractId, status: 'PAID' },
      select: { amount: true },
    });
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid + payment.amount > (await prisma.contract.findUnique({ where: { id: payment.contractId } }))!.rentAmount) {
      return res.status(400).json({ message: 'Payment would exceed remaining balance' });
    }

    const updated = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    await logActivity({ userId: req.user!.id, action: 'MARK_PAID', entity: 'Payment', entityId: payment.id });
    await notifyUser(payment.clientId, 'تم تأكيد الدفعة', `تم تأكيد استلام ${payment.amount} دينار`, 'info', `/client/payments`);
    await notifyAdmins('دفعة جديدة', `تم تأكيد دفعة ${payment.amount} دينار`, 'info', `/admin/payments/${payment.id}`);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const [totalRevenue, pendingPayments, overdueCount, occupancyRate] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'OVERDUE' } }),
      prisma.warehouse.count({ where: { status: 'RENTED' } }),
    ]);

    const totalWarehouses = await prisma.warehouse.count();
    const activeContracts = await prisma.contract.count({ where: { status: 'ACTIVE' } });

    res.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingRevenue: pendingPayments._sum.amount || 0,
      overduePayments: overdueCount,
      occupancyRate: totalWarehouses > 0 ? (occupancyRate / totalWarehouses) * 100 : 0,
      totalWarehouses,
      rentedWarehouses: occupancyRate,
      activeContracts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getMethods(_req: AuthRequest, res: Response) {
  res.json(getPaymentMethods());
}

export async function initiatePayment(req: AuthRequest, res: Response) {
  try {
    const { paymentId, method } = z.object({
      paymentId: z.string(),
      method: z.enum(['ki_card', 'zaincash', 'cash', 'bank']),
    }).parse(req.body);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.clientId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (payment.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot pay a ${payment.status.toLowerCase()} payment` });
    }

    const result = await processPayment({
      amount: Number(payment.amount),
      method,
      currency: payment.currency,
      description: payment.description || undefined,
    });

    if (result.success) {
      // Check for overpayment
      const paidPayments = await prisma.payment.findMany({
        where: { contractId: payment.contractId, status: 'PAID' },
        select: { amount: true },
      });
      const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid + payment.amount > (await prisma.contract.findUnique({ where: { id: payment.contractId } }))!.rentAmount) {
        return res.status(400).json({ success: false, message: 'Payment would exceed remaining balance' });
      }

      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', method, referenceNo: result.referenceNo, paidAt: new Date() },
      });
      await logActivity({
        userId: req.user!.id,
        action: 'PAYMENT_COMPLETED',
        entity: 'Payment',
        entityId: paymentId,
        details: { referenceNo: result.referenceNo, method },
      });
      await notifyAdmins('دفعة جديدة', `تم دفع ${payment.amount} دينار عبر ${method}`, 'info', `/admin/payments/${paymentId}`);
    }

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
