/**
 * ProChat PeerJS Manager
 * Uses PeerJS cloud signaling + free TURN servers for real cross-NAT WebRTC.
 * Enables 1080p 60fps screen sharing and HD voice calls across any network worldwide.
 */
import Peer from 'peerjs';
type MediaConnection = ReturnType<Peer['call']>;

type OnRemoteStream = (peerId: string, stream: MediaStream, meta: { name: string; avatarUrl: string }) => void;
type OnPeerLeave = (peerId: string) => void;

class PeerJSManager {
  private peer: Peer | null = null;
  private myPeerId: string = '';
  private calls: Map<string, MediaConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStream: OnRemoteStream | null = null;
  private onPeerLeave: OnPeerLeave | null = null;
  private myMeta: { name: string; avatarUrl: string } = { name: '', avatarUrl: '' };

  /** Derive deterministic PeerJS ID from server invite code + user ID */
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
  }): Promise<string> {
    this.cleanup();

    this.localStream = params.localStream;
    this.onRemoteStream = params.onRemoteStream;
    this.onPeerLeave = params.onPeerLeave;
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
          peer2.on('error', (e2) => { console.warn('[PeerJS] Fallback error:', e2); reject(e2); });
        }
      });

      peer.on('call', (call) => this.handleIncomingCall(call));
    });
  }

  private handleIncomingCall(call: MediaConnection) {
    if (!this.localStream) return;

    console.log('[PeerJS] Answering call from:', call.peer);
    call.answer(this.localStream);
    this.calls.set(call.peer, call);

    call.on('stream', (remoteStream) => {
      console.log('[PeerJS] Remote stream received from:', call.peer);
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

  /**
   * Call a target peer directly using their exact PeerJS ID
   */
  callPeerDirect(targetPeerId: string) {
    if (!this.peer || !this.localStream || !targetPeerId) return;
    if (this.calls.has(targetPeerId) || targetPeerId === this.myPeerId) return;

    console.log('[PeerJS] Calling peer directly:', targetPeerId);

    const call = this.peer.call(targetPeerId, this.localStream, {
      metadata: this.myMeta,
    });

    if (!call) return;
    this.calls.set(targetPeerId, call);

    call.on('stream', (remoteStream) => {
      console.log('[PeerJS] Stream received from outbound call:', targetPeerId);
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

  /** Replace local stream (e.g. mic → screen share) */
  async replaceStream(newStream: MediaStream) {
    this.localStream = newStream;

    for (const [, call] of this.calls) {
      const pc = (call as any).peerConnection as RTCPeerConnection;
      if (!pc) continue;

      const senders = pc.getSenders();
      for (const track of newStream.getTracks()) {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          await sender.replaceTrack(track).catch(() => {});
        }
      }
    }
  }

  getMyPeerId() { return this.myPeerId; }

  cleanup() {
    this.calls.forEach(call => call.close());
    this.calls.clear();
    this.localStream = null;
    this.peer?.destroy();
    this.peer = null;
    this.myPeerId = '';
  }
}

export const peerJSManager = new PeerJSManager();
export default peerJSManager;
