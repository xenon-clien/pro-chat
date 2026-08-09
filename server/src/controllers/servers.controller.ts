import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const initServers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Find servers the user is a member of
    let members = await prisma.member.findMany({
      where: { userId },
      include: {
        server: {
          include: {
            channels: true
          }
        }
      }
    });

    // If no servers, create a default one and add them
    if (members.length === 0) {
      const server = await prisma.server.create({
        data: {
          name: 'ProChat Community',
          inviteCode: 'PROCHAT_' + Math.random().toString(36).substring(7),
          ownerId: userId,
          channels: {
            create: [
              { name: 'general', type: 'TEXT' },
              { name: 'random', type: 'TEXT' }
            ]
          },
          members: {
            create: {
              userId,
              role: 'ADMIN'
            }
          }
        },
        include: { channels: true }
      });
      
      return res.json([{ server }]);
    }

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createServer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!name) return res.status(400).json({ message: 'Server name is required' });

    const server = await prisma.server.create({
      data: {
        name,
        inviteCode: 'PROCHAT_' + Math.random().toString(36).substring(7),
        ownerId: userId,
        channels: {
          create: [
            { name: 'general', type: 'TEXT' },
          ]
        },
        members: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      },
      include: { channels: true }
    });

    res.status(201).json(server);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
