import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { getIo } from '../socket';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });

    // Broadcast the new message via Socket.io
    const io = getIo();
    if (io) {
      io.to(channelId).emit('newMessage', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
