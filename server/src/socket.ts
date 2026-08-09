import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance: Server | null = null;

export const setupSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  ioInstance = io;

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production') as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
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

    // Handle messages
    socket.on('sendMessage', (data: { roomId: string, message: any }) => {
      io.to(data.roomId).emit('newMessage', data.message);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user?.id}`);
    });
  });

  return io;
};

export const getIo = () => ioInstance;
