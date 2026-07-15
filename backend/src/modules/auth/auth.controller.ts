import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional().or(z.literal('')),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  role: z.enum(['ADMIN', 'CLIENT', 'GUARD']).default('CLIENT'),
  language: z.enum(['ar', 'en', 'ku']).default('ar'),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string(),
});

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d' as any,
  });
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email || `guard-${crypto.randomBytes(4).toString('hex')}@system.local`;
    const username = data.username || undefined;

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email already registered' });
    }
    if (username) {
      const existingUsername = await prisma.user.findFirst({ where: { username } });
      if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash, fullName: data.fullName, phone: data.phone, role: data.role, language: data.language },
      select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, language: true },
    });

    const token = generateToken(user);
    await logActivity({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });

    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.email },
        ],
      },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    await logActivity({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

    res.json({
      user: { id: user.id, email: user.email, username: user.username, fullName: user.fullName, role: user.role, language: user.language },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, language: true, avatarUrl: true, isActive: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const data = z.object({
      fullName: z.string().min(2).optional(),
      phone: z.string().min(8).optional(),
      language: z.enum(['ar', 'en', 'ku']).optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, email: true, fullName: true, phone: true, role: true, language: true },
    });

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const { role } = req.query;
    const where: any = {};
    if (role) where.role = role;
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, language: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createUserByAdmin(req: AuthRequest, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email || `guard-${crypto.randomBytes(4).toString('hex')}@system.local`;
    const username = data.username || undefined;

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email already registered' });
    }
    if (username) {
      const existingUsername = await prisma.user.findFirst({ where: { username } });
      if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash, fullName: data.fullName, phone: data.phone, role: data.role, language: data.language },
      select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, language: true },
    });
    await logActivity({ userId: req.user!.id, action: 'CREATE_USER', entity: 'User', entityId: user.id });
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const schema = z.object({
      fullName: z.string().min(2).optional(),
      email: z.string().email().optional(),
      username: z.string().min(3).optional().or(z.literal('')),
      phone: z.string().min(8).optional(),
      password: z.string().min(6).optional(),
      role: z.enum(['ADMIN', 'CLIENT', 'GUARD']).optional(),
      isActive: z.boolean().optional(),
      language: z.enum(['ar', 'en', 'ku']).optional(),
    });
    const data = schema.parse(req.body);
    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }
    delete updateData.password;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, language: true, isActive: true },
    });
    await logActivity({ userId: req.user!.id, action: 'UPDATE_USER', entity: 'User', entityId: user.id });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    if ((err as any)?.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    await logActivity({ userId: req.user!.id, action: 'DELETE_USER', entity: 'User', entityId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    if ((err as any)?.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
