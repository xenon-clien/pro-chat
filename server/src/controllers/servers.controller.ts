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

export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serverId } = req.params;
    const { name, type = 'TEXT' } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!name) return res.status(400).json({ message: 'Channel name is required' });

    // Verify member is in server
    const member = await prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId
        }
      }
    });

    if (!member) return res.status(403).json({ message: 'You are not a member of this server' });

    const channel = await prisma.channel.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        serverId
      }
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServerMembers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serverId } = req.params;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const members = await prisma.member.findMany({
      where: { serverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            status: true
          }
        }
      }
    });

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateServer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serverId } = req.params;
    const { name, iconUrl } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { members: true }
    });

    if (!server) return res.status(404).json({ message: 'Server not found' });

    // Check if user is owner or admin
    const member = server.members.find(m => m.userId === userId);
    const isOwner = server.ownerId === userId;
    const isAdmin = member?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the server owner or admin can change server settings and icon' });
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(iconUrl !== undefined ? { iconUrl } : {})
      },
      include: { channels: true }
    });

    res.json(updatedServer);
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serverId, memberId } = req.params;
    const { role } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!['ADMIN', 'MODERATOR', 'GUEST'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { members: true }
    });

    if (!server) return res.status(404).json({ message: 'Server not found' });

    const requester = server.members.find(m => m.userId === userId);
    const isOwner = server.ownerId === userId;
    const isAdmin = requester?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the server owner or admin can change member roles' });
    }

    const targetMember = server.members.find(m => m.id === memberId);
    if (!targetMember) return res.status(404).json({ message: 'Member not found' });

    // Prevent demoting owner
    if (targetMember.userId === server.ownerId && role !== 'ADMIN') {
      return res.status(400).json({ message: 'Cannot remove ADMIN role from the server owner' });
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            status: true
          }
        }
      }
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteServer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serverId } = req.params;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) return res.status(404).json({ message: 'Server not found' });

    if (server.ownerId !== userId) {
      return res.status(403).json({ message: 'Only the server owner can delete this server' });
    }

    await prisma.server.delete({
      where: { id: serverId }
    });

    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


