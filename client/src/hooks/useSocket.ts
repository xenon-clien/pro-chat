import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';

export const useSocket = (channelId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const { addMessage } = useMessageStore();

  useEffect(() => {
    if (!token || !channelId) return;

    // Connect to Socket.io server
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      withCredentials: true,
    });

    // Join the channel room
    socketRef.current.emit('joinRoom', channelId);

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      // Only add if it belongs to current channel
      if (message.channelId === channelId) {
        addMessage(message);
      }
    });

    // Cleanup on unmount or channel change
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveRoom', channelId);
        socketRef.current.disconnect();
      }
    };
  }, [token, channelId, addMessage]);

  return socketRef.current;
};
