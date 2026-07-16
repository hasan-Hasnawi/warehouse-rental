import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12);
  const guardHash = await bcrypt.hash('salam123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@sotrage.com' },
    update: {},
    create: { email: 'admin@sotrage.com', passwordHash: adminHash, fullName: 'مدير النظام', phone: '07700000000', role: 'ADMIN', language: 'ar' },
  });

  const guard = await prisma.user.upsert({
    where: { email: 'salam@test.com' },
    update: {},
    create: { email: 'salam@test.com', passwordHash: guardHash, fullName: 'سلام', phone: '07711111111', role: 'GUARD', language: 'ar' },
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-1' },
    update: {},
    create: { id: 'seed-tenant-1', name: 'مستأجر تجريبي', phone: '07722222222' },
  });

  const groupA = await prisma.group.upsert({
    where: { id: 'seed-group-a' },
    update: {},
    create: { id: 'seed-group-a', name: 'المجموعة أ', investorName: 'مستثمر أ', description: 'مخازن المنطقة الصناعية' },
  });

  const groupB = await prisma.group.upsert({
    where: { id: 'seed-group-b' },
    update: {},
    create: { id: 'seed-group-b', name: 'المجموعة ب', investorName: 'مستثمر ب', description: 'مخازن المنطقة التجارية' },
  });

  const w1 = await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: { guardId: guard.id, groupId: groupA.id, pricePer6Months: 9000000, status: 'RENTED' },
    create: { name: 'مخزن المنطقة الصناعية أ', code: 'WH-001', description: 'مخزن كبير في المنطقة الصناعية', area: 500, address: 'المنطقة الصناعية، شارع 15', city: 'بغداد', pricePerMonth: 1500000, pricePer6Months: 9000000, guardId: guard.id, groupId: groupA.id, status: 'RENTED', features: JSON.stringify(['24h_security', 'cctv', 'loading_dock', 'ventilation']) },
  });

  const w2 = await prisma.warehouse.upsert({
    where: { code: 'WH-002' },
    update: { guardId: guard.id, groupId: groupA.id, pricePer6Months: 5400000, status: 'RENTED' },
    create: { name: 'مخزن شارع المطار', code: 'WH-002', description: 'مخزن متوسط قرب مطار بغداد', area: 300, address: 'شارع المطار، مجمع الأعمال', city: 'بغداد', pricePerMonth: 900000, pricePer6Months: 5400000, guardId: guard.id, groupId: groupA.id, status: 'RENTED', features: JSON.stringify(['cctv', 'fire_safety']) },
  });

  const w3 = await prisma.warehouse.upsert({
    where: { code: 'WH-003' },
    update: { guardId: guard.id, groupId: groupB.id, pricePer6Months: 4500000 },
    create: { name: 'مخزن الكرادة', code: 'WH-003', description: 'مخزن في منطقة الكرادة التجارية', area: 200, address: 'الكرادة، شارع أبو نؤاس', city: 'بغداد', pricePerMonth: 750000, pricePer6Months: 4500000, guardId: guard.id, groupId: groupB.id, features: JSON.stringify(['cctv', 'ac']) },
  });

  const w4 = await prisma.warehouse.upsert({
    where: { code: 'WH-004' },
    update: { guardId: guard.id, groupId: groupB.id, pricePer6Months: 7200000 },
    create: { name: 'مخزن أربيل الصناعي', code: 'WH-004', description: 'مخزن واسع في المنطقة الصناعية بأربيل', area: 400, address: 'المنطقة الصناعية، شارع 40', city: 'أربيل', pricePerMonth: 1200000, pricePer6Months: 7200000, guardId: guard.id, groupId: groupB.id, features: JSON.stringify(['24h_security', 'cctv', 'loading_dock']) },
  });

  const now = new Date();

  const c1Start = new Date(now); c1Start.setDate(c1Start.getDate() - 170);
  const c1End = new Date(now); c1End.setDate(c1End.getDate() + 10);

  const c2Start = new Date(now); c2Start.setDate(c2Start.getDate() - 210);
  const c2End = new Date(now); c2End.setDate(c2End.getDate() - 30);

  const rent1 = w1.pricePerMonth * 6;
  const rent2 = w2.pricePerMonth * 6;

  const c1 = await prisma.contract.upsert({
    where: { contractNo: 'CTR-001' },
    update: {},
    create: {
      contractNo: 'CTR-001', tenantId: tenant.id, warehouseId: w1.id,
      startDate: c1Start, endDate: c1End, rentAmount: rent1,
      discount: 0, guardFeeMonthly: 100000, isPreAgreed: true,
      status: 'ACTIVE', signedByAdmin: true, signedByTenant: true,
    },
  });

  const c2 = await prisma.contract.upsert({
    where: { contractNo: 'CTR-002' },
    update: {},
    create: {
      contractNo: 'CTR-002', tenantId: tenant.id, warehouseId: w2.id,
      startDate: c2Start, endDate: c2End, rentAmount: rent2,
      discount: 500000, guardFeeMonthly: 75000, isPreAgreed: true,
      status: 'ACTIVE', signedByAdmin: true, signedByTenant: true,
    },
  });

  await prisma.payment.create({
    data: {
      contractId: c1.id, tenantId: tenant.id, amount: rent1,
      method: 'ki_card', status: 'PAID', dueDate: c1Start,
      paidAt: c1Start, description: 'دفعة 6 أشهر - مخزن المنطقة الصناعية أ',
    },
  });

  await prisma.payment.create({
    data: {
      contractId: c2.id, tenantId: tenant.id, amount: rent2,
      method: 'zaincash', status: 'OVERDUE', dueDate: c2End,
      description: 'دفعة 6 أشهر - مخزن شارع المطار (متأخرة)',
    },
  });

  console.log('Seed completed successfully');
  console.log('---');
  console.log('Admin:  admin@sotrage.com / admin123');
  console.log('Guard:  salam@test.com    / salam123');
  console.log('Groups: المجموعة أ (مستثمر أ), المجموعة ب (مستثمر ب)');
  console.log('Warehouses: WH-001→WH-004 assigned to guard سلام');
  console.log('Contract CTR-001: expires in ~10 days (orange)');
  console.log('Contract CTR-002: expired ~30 days ago (red)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
