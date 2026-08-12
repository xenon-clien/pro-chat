import { useEffect } from 'react';
import { socketService } from '../lib/socket';
import { useMessageStore } from '../store/useMessageStore';

export const useSocket = (channelId: string) => {
  const { addMessage } = useMessageStore();

  useEffect(() => {
    if (!channelId) return;

    // Initialize socket connection
    socketService.init();

    // Join the channel room
    socketService.joinRoom(channelId);

    // Register message listener
    const unsub = socketService.onNewMessage((message: any) => {
      if (message && (message.channelId === channelId || message.roomId === channelId)) {
        addMessage(message);
      }
    });

    return () => {
      unsub();
      socketService.leaveRoom(channelId);
    };
  }, [channelId, addMessage]);

  return socketService.getSocket();
};

export default useSocket;
