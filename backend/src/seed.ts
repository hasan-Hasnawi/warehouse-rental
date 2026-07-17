import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanOldData() {
  // Delete all old seed warehouses (those with auto-generated IDs, not our fixed ones)
  const oldWarehouses = await prisma.warehouse.findMany({
    where: {
      id: { notIn: ['seed-wh-1', 'seed-wh-2', 'seed-wh-3', 'seed-wh-4', 'seed-wh-5', 'seed-wh-6', 'seed-wh-7', 'seed-wh-8'] },
    },
    select: { id: true },
  });
  const oldIds = oldWarehouses.map(w => w.id);

  if (oldIds.length > 0) {
    // Delete payments linked to old warehouses' contracts
    const oldContracts = await prisma.contract.findMany({
      where: { warehouseId: { in: oldIds } },
      select: { id: true },
    });
    const oldContractIds = oldContracts.map(c => c.id);

    if (oldContractIds.length > 0) {
      await prisma.payment.deleteMany({ where: { contractId: { in: oldContractIds } } });
      await prisma.guardCollection.deleteMany({ where: { contractId: { in: oldContractIds } } });
    }

    // Clean other relations referencing old warehouses
    await prisma.accessLog.updateMany({ where: { warehouseId: { in: oldIds } }, data: { warehouseId: null } });
    await prisma.guardTask.updateMany({ where: { warehouseId: { in: oldIds } }, data: { warehouseId: null } });
    await prisma.guardReport.updateMany({ where: { warehouseId: { in: oldIds } }, data: { warehouseId: null } });

    // Delete old contracts and warehouses
    await prisma.contract.deleteMany({ where: { warehouseId: { in: oldIds } } });
    await prisma.warehouse.deleteMany({ where: { id: { in: oldIds } } });

    console.log(`Cleaned ${oldIds.length} old warehouses and related data`);
  }
}

async function main() {
  // Drop old unique constraint on code (from previous schema version) if it still exists
  await prisma.$executeRawUnsafe(`ALTER TABLE "Warehouse" DROP CONSTRAINT IF EXISTS "Warehouse_code_key"`).catch(() => {});

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

  const tenant1 = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-1' },
    update: {},
    create: { id: 'seed-tenant-1', name: 'مستأجر تجريبي', phone: '07722222222' },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-2' },
    update: {},
    create: { id: 'seed-tenant-2', name: 'شركة الأمل', phone: '07733333333', phone2: '07744444444' },
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

  const groupC = await prisma.group.upsert({
    where: { id: 'seed-group-c' },
    update: {},
    create: { id: 'seed-group-c', name: 'المجموعة ج', investorName: 'مستثمر ج', description: 'مخازن المنطقة اللوجستية' },
  });

  // Clean old warehouses before creating new ones
  await cleanOldData();

  // Group A: 3 warehouses
  const w1 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-1' },
    update: { guardId: guard.id, groupId: groupA.id, pricePer6Months: 9000000, status: 'RENTED', code: '1', name: `${groupA.name} - 1` },
    create: { id: 'seed-wh-1', name: `${groupA.name} - 1`, code: '1', description: 'مخزن كبير في المنطقة الصناعية', area: 500, address: 'المنطقة الصناعية، شارع 15', city: 'بغداد', pricePerMonth: 1500000, pricePer6Months: 9000000, guardId: guard.id, groupId: groupA.id, status: 'RENTED', features: JSON.stringify(['24h_security', 'cctv', 'loading_dock', 'ventilation']) },
  });

  const w2 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-2' },
    update: { guardId: guard.id, groupId: groupA.id, pricePer6Months: 5400000, status: 'RENTED', code: '2', name: `${groupA.name} - 2` },
    create: { id: 'seed-wh-2', name: `${groupA.name} - 2`, code: '2', description: 'مخزن متوسط قرب مطار بغداد', area: 300, address: 'شارع المطار، مجمع الأعمال', city: 'بغداد', pricePerMonth: 900000, pricePer6Months: 5400000, guardId: guard.id, groupId: groupA.id, status: 'RENTED', features: JSON.stringify(['cctv', 'fire_safety']) },
  });

  const w3 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-3' },
    update: { guardId: guard.id, groupId: groupA.id, pricePer6Months: 3600000, status: 'VACANT', code: '3', name: `${groupA.name} - 3` },
    create: { id: 'seed-wh-3', name: `${groupA.name} - 3`, code: '3', description: 'مخزن صغير في المنطقة الصناعية', area: 150, address: 'المنطقة الصناعية، شارع 20', city: 'بغداد', pricePerMonth: 600000, pricePer6Months: 3600000, guardId: guard.id, groupId: groupA.id, status: 'VACANT', features: JSON.stringify(['cctv']) },
  });

  // Group B: 3 warehouses
  const w4 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-4' },
    update: { guardId: guard.id, groupId: groupB.id, pricePer6Months: 4500000, status: 'VACANT', code: '1', name: `${groupB.name} - 1` },
    create: { id: 'seed-wh-4', name: `${groupB.name} - 1`, code: '1', description: 'مخزن في منطقة الكرادة التجارية', area: 200, address: 'الكرادة، شارع أبو نؤاس', city: 'بغداد', pricePerMonth: 750000, pricePer6Months: 4500000, guardId: guard.id, groupId: groupB.id, status: 'VACANT', features: JSON.stringify(['cctv', 'ac']) },
  });

  const w5 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-5' },
    update: { guardId: guard.id, groupId: groupB.id, pricePer6Months: 7200000, status: 'RENTED', code: '2', name: `${groupB.name} - 2` },
    create: { id: 'seed-wh-5', name: `${groupB.name} - 2`, code: '2', description: 'مخزن واسع في المنطقة الصناعية بأربيل', area: 400, address: 'المنطقة الصناعية، شارع 40', city: 'أربيل', pricePerMonth: 1200000, pricePer6Months: 7200000, guardId: guard.id, groupId: groupB.id, status: 'RENTED', features: JSON.stringify(['24h_security', 'cctv', 'loading_dock']) },
  });

  const w6 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-6' },
    update: { guardId: guard.id, groupId: groupB.id, pricePer6Months: 6000000, status: 'MAINTENANCE', code: '3', name: `${groupB.name} - 3` },
    create: { id: 'seed-wh-6', name: `${groupB.name} - 3`, code: '3', description: 'مخزن يحتاج صيانة', area: 250, address: 'حي الصناعة، شارع 10', city: 'أربيل', pricePerMonth: 1000000, pricePer6Months: 6000000, guardId: guard.id, groupId: groupB.id, status: 'MAINTENANCE', features: JSON.stringify(['cctv', 'fire_safety']) },
  });

  // Group C: 2 warehouses (all vacant)
  const w7 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-7' },
    update: { guardId: guard.id, groupId: groupC.id, pricePer6Months: 4800000, status: 'VACANT', code: '1', name: `${groupC.name} - 1` },
    create: { id: 'seed-wh-7', name: `${groupC.name} - 1`, code: '1', description: 'مخزن لوجستي جديد', area: 350, address: 'المنطقة اللوجستية، شارع 5', city: 'بغداد', pricePerMonth: 800000, pricePer6Months: 4800000, guardId: guard.id, groupId: groupC.id, status: 'VACANT', features: JSON.stringify(['24h_security', 'cctv', 'loading_dock', 'ac', 'ventilation']) },
  });

  const w8 = await prisma.warehouse.upsert({
    where: { id: 'seed-wh-8' },
    update: { guardId: guard.id, groupId: groupC.id, pricePer6Months: 3000000, status: 'VACANT', code: '2', name: `${groupC.name} - 2` },
    create: { id: 'seed-wh-8', name: `${groupC.name} - 2`, code: '2', description: 'مخزن لوجستي صغير', area: 180, address: 'المنطقة اللوجستية، شارع 7', city: 'بغداد', pricePerMonth: 500000, pricePer6Months: 3000000, guardId: guard.id, groupId: groupC.id, status: 'VACANT', features: JSON.stringify(['cctv']) },
  });

  const now = new Date();

  // Contract 1: Active, expires in ~10 days (for w1)
  const c1Start = new Date(now); c1Start.setDate(c1Start.getDate() - 170);
  const c1End = new Date(now); c1End.setDate(c1End.getDate() + 10);
  const rent1 = w1.pricePerMonth * 6;

  // Contract 2: Expired, 30 days ago (for w2)
  const c2Start = new Date(now); c2Start.setDate(c2Start.getDate() - 210);
  const c2End = new Date(now); c2End.setDate(c2End.getDate() - 30);
  const rent2 = w2.pricePerMonth * 6;

  // Contract 3: Active, expires in ~45 days (for w5)
  const c3Start = new Date(now); c3Start.setDate(c3Start.getDate() - 135);
  const c3End = new Date(now); c3End.setDate(c3End.getDate() + 45);
  const rent3 = w5.pricePerMonth * 6;

  // Reset contract counter
  await prisma.contractCounter.upsert({
    where: { id: 'singleton' },
    update: { nextNo: 4 },
    create: { id: 'singleton', nextNo: 4 },
  });

  // Delete old contracts for our seed warehouses first (if re-running seed)
  await prisma.payment.deleteMany({ where: { contract: { warehouseId: { in: [w1.id, w2.id, w5.id] } } } });
  await prisma.contract.deleteMany({ where: { warehouseId: { in: [w1.id, w2.id, w5.id] } } });

  const c1 = await prisma.contract.create({
    data: {
      contractNo: 'CTR-001', tenantId: tenant1.id, warehouseId: w1.id,
      startDate: c1Start, endDate: c1End, rentAmount: rent1,
      discount: 0, guardFeeMonthly: 100000, isPreAgreed: true,
      status: 'ACTIVE', signedByAdmin: true, signedByTenant: true,
    },
  });

  const c2 = await prisma.contract.create({
    data: {
      contractNo: 'CTR-002', tenantId: tenant1.id, warehouseId: w2.id,
      startDate: c2Start, endDate: c2End, rentAmount: rent2,
      discount: 500000, guardFeeMonthly: 75000, isPreAgreed: true,
      status: 'ACTIVE', signedByAdmin: true, signedByTenant: true,
    },
  });

  const c3 = await prisma.contract.create({
    data: {
      contractNo: 'CTR-003', tenantId: tenant2.id, warehouseId: w5.id,
      startDate: c3Start, endDate: c3End, rentAmount: rent3,
      discount: 200000, guardFeeMonthly: 80000, isPreAgreed: true,
      status: 'ACTIVE', signedByAdmin: true, signedByTenant: true,
      storedMaterials: 'مواد غذائية متنوعة',
    },
  });

  // Payments for contract 1 (fully paid)
  await prisma.payment.create({
    data: {
      contractId: c1.id, tenantId: tenant1.id, amount: rent1,
      method: 'ki_card', status: 'PAID', dueDate: c1Start,
      paidAt: c1Start, description: 'دفعة 6 أشهر - المجموعة أ - 1',
    },
  });

  // Payments for contract 2 (overdue)
  await prisma.payment.create({
    data: {
      contractId: c2.id, tenantId: tenant1.id, amount: rent2,
      method: 'zaincash', status: 'OVERDUE', dueDate: c2End,
      description: 'دفعة 6 أشهر - المجموعة أ - 2',
    },
  });

  // Payments for contract 3 (partially paid)
  await prisma.payment.create({
    data: {
      contractId: c3.id, tenantId: tenant2.id, amount: rent3 / 2,
      method: 'cash', status: 'PAID', dueDate: c3Start,
      paidAt: c3Start, description: 'دفعة أولى - المجموعة ب - 2',
    },
  });

  await prisma.payment.create({
    data: {
      contractId: c3.id, tenantId: tenant2.id, amount: rent3 / 2,
      method: 'bank', status: 'PENDING', dueDate: c3End,
      description: 'دفعة ثانية - المجموعة ب - 2',
    },
  });

  console.log('Seed completed successfully');
  console.log('---');
  console.log('Admin:  admin@sotrage.com / admin123');
  console.log('Guard:  salam@test.com    / salam123');
  console.log('Groups: المجموعة أ (مستثمر أ), المجموعة ب (مستثمر ب), المجموعة ج (مستثمر ج)');
  console.log('Warehouses:');
  console.log('  المجموعة أ: 1 (مؤجر), 2 (مؤجر), 3 (شاغر)');
  console.log('  المجموعة ب: 1 (شاغر), 2 (مؤجر), 3 (صيانة)');
  console.log('  المجموعة ج: 1 (شاغر), 2 (شاغر)');
  console.log('Contracts:');
  console.log('  CTR-001: المجموعة أ - 1 (ينتهي بعد 10 أيام)');
  console.log('  CTR-002: المجموعة أ - 2 (منتهي منذ 30 يوماً)');
  console.log('  CTR-003: المجموعة ب - 2 (ينتهي بعد 45 يوماً - شركة الأمل)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
