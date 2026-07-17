import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './modules/auth/auth.routes';
import warehouseRoutes from './modules/warehouses/warehouse.routes';
import contractRoutes from './modules/contracts/contract.routes';
import paymentRoutes from './modules/payments/payment.routes';
import guardRoutes from './modules/guards/guard.routes';
import tenantRoutes from './modules/tenants/tenant.routes';
import groupRoutes from './modules/groups/group.routes';
import notificationRoutes from './modules/notifications/notification.routes';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/guards', guardRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);

// TEMP: drop old unique constraint on code
app.post('/api/admin/drop-constraint', async (req: any, res: any) => {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Warehouse" DROP CONSTRAINT IF EXISTS "Warehouse_code_key"`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Warehouse_code_key"`);
    res.json({ message: 'Done' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function autoExpireContracts() {
  try {
    const now = new Date();
    const expired = await prisma.contract.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
    });
    for (const contract of expired) {
      await prisma.contract.update({ where: { id: contract.id }, data: { status: 'EXPIRED' } });
      await prisma.warehouse.update({ where: { id: contract.warehouseId }, data: { status: 'VACANT' } });
      console.log(`Auto-expired contract ${contract.contractNo}`);
    }
    if (expired.length > 0) {
      console.log(`Auto-expired ${expired.length} contracts`);
    }
  } catch (err) {
    console.error('Auto-expire error:', err);
  }
}

// Run at startup and every hour
autoExpireContracts();
setInterval(autoExpireContracts, 60 * 60 * 1000);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
