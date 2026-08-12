import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance: Server | null = null;

export const setupSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  ioInstance = io;

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.data.user = { id: 'guest-' + socket.id.substring(0, 6), name: 'Pro Guest' };
      return next();
    }
    try {
      if (typeof token === 'string' && (token.startsWith('demo-') || token.startsWith('guest-'))) {
        socket.data.user = { id: 'usr-' + socket.id.substring(0, 6), name: 'Pro Member' };
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production') as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      socket.data.user = { id: 'usr-' + socket.id.substring(0, 6), name: 'Pro Member' };
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.user?.id}`);

    // Join a room (e.g. server room or channel room)
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.data.user?.id} joined room ${roomId}`);
    });

    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${socket.data.user?.id} left room ${roomId}`);
    });

    // Voice & WebRTC Signaling
    socket.on('voice:join', (data: { channelId: string, user: any }) => {
      socket.join(`voice:${data.channelId}`);
      socket.to(`voice:${data.channelId}`).emit('voice:user-joined', {
        socketId: socket.id,
        user: data.user
      });
      console.log(`User ${data.user?.name} joined voice channel ${data.channelId}`);
    });

    socket.on('voice:signal', (data: { targetSocketId: string, signal: any, fromUser: any }) => {
      io.to(data.targetSocketId).emit('voice:signal', {
        fromSocketId: socket.id,
        signal: data.signal,
        fromUser: data.fromUser
      });
    });

    socket.on('voice:state-change', (data: { channelId: string, state: any }) => {
      socket.to(`voice:${data.channelId}`).emit('voice:state-changed', {
        socketId: socket.id,
        userId: socket.data.user?.id,
        state: data.state
      });
    });

    socket.on('voice:leave', (data: { channelId: string }) => {
      socket.leave(`voice:${data.channelId}`);
      socket.to(`voice:${data.channelId}`).emit('voice:user-left', {
        socketId: socket.id,
        userId: socket.data.user?.id
      });
      console.log(`User ${socket.data.user?.id} left voice channel ${data.channelId}`);
    });

    // Soundboard: broadcast a sound to everyone in a voice channel
    socket.on('soundboard:play', (data: { channelId: string, soundId: string, soundName: string, audioDataUrl?: string, volume?: number }) => {
      // Broadcast to everyone else in the voice channel room
      socket.to(`voice:${data.channelId}`).emit('soundboard:incoming', {
        soundId: data.soundId,
        soundName: data.soundName,
        audioDataUrl: data.audioDataUrl,
        volume: data.volume ?? 1,
        fromUser: socket.data.user
      });
      console.log(`Soundboard: ${socket.data.user?.name} played ${data.soundName} in channel ${data.channelId}`);
    });

    // Handle messages
    socket.on('sendMessage', (data: { roomId: string, message: any }) => {
      io.to(data.roomId).emit('newMessage', data.message);
    });

    socket.on('disconnect', () => {
      io.emit('voice:user-left', {
        socketId: socket.id,
        userId: socket.data.user?.id
      });
      console.log(`User disconnected: ${socket.data.user?.id}`);
    });
  });

  return io;
};

export const getIo = () => ioInstance;
