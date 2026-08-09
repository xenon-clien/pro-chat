import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';

export const useSocket = (channelId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuthStore();
  const { addMessage } = useMessageStore();

  useEffect(() => {
    if (!token || !channelId) return;

    // Connect to Socket.io server
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      withCredentials: true,
    });

    // Join the channel room
    newSocket.emit('joinRoom', channelId);

    // Listen for new messages
    newSocket.on('newMessage', (message) => {
      // Only add if it belongs to current channel
      if (message.channelId === channelId) {
        addMessage(message);
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount or channel change
    return () => {
      newSocket.emit('leaveRoom', channelId);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token, channelId, addMessage]);

  return socket;
};
