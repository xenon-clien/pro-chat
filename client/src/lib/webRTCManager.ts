/**
 * ProChat PeerJS WebRTC & Screen Sharing Manager
 * Handles 1080p 60fps Screen Sharing, HD Voice, and P2P DataChannels between users across all networks.
 */
import Peer from 'peerjs';

type MediaConnection = ReturnType<Peer['call']>;
type DataConnection = ReturnType<Peer['connect']>;

type OnRemoteStream = (peerId: string, stream: MediaStream, meta: { name: string; avatarUrl: string }) => void;
type OnPeerLeave = (peerId: string) => void;
type OnDataMessage = (data: any) => void;

class PeerJSManager {
  private peer: Peer | null = null;
  private myPeerId: string = '';
  private calls: Map<string, MediaConnection> = new Map();
  private dataConns: Map<string, DataConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStream: OnRemoteStream | null = null;
  private onPeerLeave: OnPeerLeave | null = null;
  private onDataMessage: OnDataMessage | null = null;
  private myMeta: { name: string; avatarUrl: string } = { name: '', avatarUrl: '' };

  public buildPeerId(inviteCode: string, userId: string): string {
    const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').substring(0, 14);
    return `pc-${safe(inviteCode)}-${safe(userId)}`.substring(0, 36);
  }

  async init(params: {
    inviteCode: string;
    userId: string;
    userName: string;
    userAvatar: string;
    localStream: MediaStream;
    onRemoteStream: OnRemoteStream;
    onPeerLeave: OnPeerLeave;
    onDataMessage?: OnDataMessage;
  }): Promise<string> {
    this.cleanup();

    this.localStream = params.localStream;
    this.onRemoteStream = params.onRemoteStream;
    this.onPeerLeave = params.onPeerLeave;
    this.onDataMessage = params.onDataMessage || null;
    this.myMeta = { name: params.userName, avatarUrl: params.userAvatar };

    const peerId = this.buildPeerId(params.inviteCode, params.userId);
    this.myPeerId = peerId;

    return new Promise((resolve, reject) => {
      const peer = new Peer(peerId, {
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        path: '/',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject',
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject',
            },
            {
              urls: 'turn:openrelay.metered.ca:443?transport=tcp',
              username: 'openrelayproject',
              credential: 'openrelayproject',
            },
          ],
        },
        debug: 0,
      });

      this.peer = peer;

      peer.on('open', (id) => {
        console.log('[PeerJS] Ready with ID:', id);
        resolve(id);
      });

      peer.on('error', (err) => {
        console.warn('[PeerJS] Error:', err);
        if (err.type === 'unavailable-id') {
          const fallbackId = peerId + '-' + Math.random().toString(36).substring(2, 5);
          this.myPeerId = fallbackId;
          const peer2 = new Peer(fallbackId, { ...peer.options });
          this.peer = peer2;
          peer2.on('open', (id2) => resolve(id2));
          peer2.on('call', (call) => this.handleIncomingCall(call));
          peer2.on('connection', (conn) => this.handleDataConnection(conn));
          peer2.on('error', (e2) => { console.warn('[PeerJS] Fallback error:', e2); reject(e2); });
        }
      });

      // Handle incoming voice / screen calls
      peer.on('call', (call) => this.handleIncomingCall(call));

      // Handle incoming P2P data channels
      peer.on('connection', (conn) => this.handleDataConnection(conn));
    });
  }

  private handleDataConnection(conn: DataConnection) {
    this.dataConns.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.onDataMessage?.(data);
    });

    conn.on('close', () => {
      this.dataConns.delete(conn.peer);
    });
  }

  private handleIncomingCall(call: MediaConnection) {
    const streamToAnswer = this.localStream || new MediaStream();
    console.log('[PeerJS] Answering call from:', call.peer);

    call.answer(streamToAnswer);
    this.calls.set(call.peer, call);

    call.on('stream', (remoteStream) => {
      console.log('[PeerJS] Remote stream received from:', call.peer, 'tracks:', remoteStream.getTracks());
      const meta = (call.metadata as { name?: string; avatarUrl?: string }) || {};
      this.onRemoteStream?.(call.peer, remoteStream, {
        name: meta.name || call.peer,
        avatarUrl: meta.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${call.peer}`,
      });
    });

    call.on('close', () => {
      this.calls.delete(call.peer);
      this.onPeerLeave?.(call.peer);
    });

    call.on('error', (err) => {
      console.warn('[PeerJS] Call error:', err);
      this.calls.delete(call.peer);
    });
  }

  /** Call a target peer directly */
  callPeerDirect(targetPeerId: string) {
    if (!this.peer || !targetPeerId) return;
    if (this.calls.has(targetPeerId) || targetPeerId === this.myPeerId) return;

    const streamToSend = this.localStream || new MediaStream();
    console.log('[PeerJS] Calling peer directly:', targetPeerId);

    const call = this.peer.call(targetPeerId, streamToSend, {
      metadata: this.myMeta,
    });

    if (call) {
      this.calls.set(targetPeerId, call);

      call.on('stream', (remoteStream) => {
        console.log('[PeerJS] Stream received from outbound call:', targetPeerId, 'tracks:', remoteStream.getTracks());
        this.onRemoteStream?.(targetPeerId, remoteStream, { name: targetPeerId, avatarUrl: '' });
      });

      call.on('close', () => {
        this.calls.delete(targetPeerId);
        this.onPeerLeave?.(targetPeerId);
      });

      call.on('error', (err) => {
        console.warn('[PeerJS] Outbound call error:', err);
        this.calls.delete(targetPeerId);
      });
    }

    // Also establish P2P Data Connection
    try {
      if (!this.dataConns.has(targetPeerId)) {
        const conn = this.peer.connect(targetPeerId);
        this.handleDataConnection(conn);
      }
    } catch (e) {}
  }

  /**
   * Broadcast screen share stream to all peers by establishing clean WebRTC video call
   */
  async replaceStream(newStream: MediaStream) {
    this.localStream = newStream;

    // Collect all peer IDs currently in call
    const targetPeerIds = Array.from(this.calls.keys());

    // Close old voice-only media connections
    this.calls.forEach((call) => {
      try { call.close(); } catch (e) {}
    });
    this.calls.clear();

    // Call each peer with the new stream (contains video track)
    for (const peerId of targetPeerIds) {
      if (this.peer && peerId !== this.myPeerId) {
        try {
          console.log('[PeerJS] Establishing fresh Screen Stream call to:', peerId);
          const screenCall = this.peer.call(peerId, newStream, {
            metadata: { ...this.myMeta, isScreen: true }
          });

          if (screenCall) {
            this.calls.set(peerId, screenCall);

            screenCall.on('stream', (rStream) => {
              console.log('[PeerJS] Stream on outbound screen call:', peerId, 'tracks:', rStream.getTracks());
              this.onRemoteStream?.(peerId, rStream, { name: this.myMeta.name, avatarUrl: this.myMeta.avatarUrl });
            });

            screenCall.on('close', () => {
              this.calls.delete(peerId);
            });

            screenCall.on('error', (e) => {
              console.warn('[PeerJS] Screen call error:', e);
              this.calls.delete(peerId);
            });
          }
        } catch (e) {
          console.warn('[PeerJS] Screen call exception:', e);
        }
      }
    }
  }

  broadcastData(data: any) {
    this.dataConns.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(data);
        } catch (e) {}
      }
    });
  }

  getMyPeerId() { return this.myPeerId; }

  cleanup() {
    this.calls.forEach(call => {
      try { call.close(); } catch (e) {}
    });
    this.calls.clear();

    this.dataConns.forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    this.dataConns.clear();

    this.localStream = null;
    this.peer?.destroy();
    this.peer = null;
    this.myPeerId = '';
  }
}

export const peerJSManager = new PeerJSManager();
export default peerJSManager;
