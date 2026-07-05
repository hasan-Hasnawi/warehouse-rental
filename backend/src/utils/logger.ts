import { prisma } from '../index';

export async function logActivity(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.activityLog.create({ data: params });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
