import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production', {
    expiresIn: '7d',
  });
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production', {
      expiresIn: '7d',
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const guestLogin = async (req: Request, res: Response) => {
  try {
    const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const guestName = `Guest_${randomId}`;
    const guestEmail = `guest_${randomId}@prochat.local`;
    
    const hashedPassword = await bcrypt.hash(randomId, 10);

    const user = await prisma.user.create({
      data: {
        name: guestName,
        email: guestEmail,
        password: hashedPassword,
      }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

interface AuthRequest extends Request {
  user?: { id: string };
}

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
