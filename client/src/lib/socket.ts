import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;
  private messageListeners = new Set<(message: any) => void>();

  public getSocket(): Socket | null {
    if (!this.socket && typeof window !== 'undefined') {
      this.init();
    }
    return this.socket;
  }

  public init() {
    if (this.socket && this.socket.connected) return this.socket;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const PROD_SOCKET_URL = 'https://wanzxplays-production.up.railway.app';
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : PROD_SOCKET_URL);

    try {
      this.socket = io(backendUrl, {
        auth: { token: token || 'guest-token' },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('[Socket.io] Connected successfully:', this.socket?.id);
        if (this.currentRoom) {
          this.socket?.emit('joinRoom', this.currentRoom);
        }
      });

      this.socket.on('newMessage', (message: any) => {
        this.messageListeners.forEach((fn) => {
          try {
            fn(message);
          } catch (e) {}
        });
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket.io] Disconnected');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket.io] Connection warning (local backend offline or network switch):', err.message);
      });
    } catch (e) {
      console.warn('[Socket.io] Init error:', e);
    }

    return this.socket;
  }

  public joinRoom(roomId: string) {
    if (!roomId) return;
    if (this.currentRoom && this.currentRoom !== roomId) {
      this.socket?.emit('leaveRoom', this.currentRoom);
    }
    this.currentRoom = roomId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinRoom', roomId);
    }
  }

  public leaveRoom(roomId: string) {
    if (this.currentRoom === roomId) {
      this.socket?.emit('leaveRoom', roomId);
      this.currentRoom = null;
    }
  }

  public emitMessage(roomId: string, message: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', { roomId, message });
    }
  }

  public onNewMessage(listener: (message: any) => void) {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }
}

export const socketService = new SocketService();
export default socketService;
