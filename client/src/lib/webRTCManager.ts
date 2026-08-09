/**
 * ProChat WebRTC Voice + Screen Share Manager
 * Uses cloudRelay (MQTT) as signaling channel for WebRTC peer-to-peer connections.
 * Handles: voice, camera, screen share between any two users in the same server.
 */

import cloudRelay from './cloudRelay';

interface RTCSignalData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'peer-join' | 'peer-leave';
  fromId: string;
  toId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  meta?: { name: string; avatarUrl: string };
}

type OnRemoteStreamCallback = (peerId: string, stream: MediaStream, meta: { name: string; avatarUrl: string }) => void;
type OnPeerLeaveCallback = (peerId: string) => void;

class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private localStream: MediaStream | null = null;
  private signalingTopic: string | null = null;
  private myId: string = '';
  private myMeta: { name: string; avatarUrl: string } = { name: '', avatarUrl: '' };
  private onRemoteStream: OnRemoteStreamCallback | null = null;
  private onPeerLeave: OnPeerLeaveCallback | null = null;
  private unsubSignaling: (() => void) | null = null;
  private announcedPeers: Set<string> = new Set();

  private ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  async joinRoom(params: {
    roomCode: string; // invite code of the server
    userId: string;
    userName: string;
    userAvatar: string;
    localStream: MediaStream;
    onRemoteStream: OnRemoteStreamCallback;
    onPeerLeave: OnPeerLeaveCallback;
  }) {
    this.cleanup();

    this.myId = params.userId;
    this.myMeta = { name: params.userName, avatarUrl: params.userAvatar };
    this.localStream = params.localStream;
    this.onRemoteStream = params.onRemoteStream;
    this.onPeerLeave = params.onPeerLeave;
    this.signalingTopic = `prochat/v1/webrtc/${params.roomCode.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

    // Listen for signaling messages
    this.unsubSignaling = cloudRelay.subscribe(this.signalingTopic, (_, data: RTCSignalData) => {
      if (!data || data.fromId === this.myId) return;
      this.handleSignal(data);
    });

    // Announce join — triggers existing peers to send offers
    cloudRelay.publish(this.signalingTopic, {
      type: 'peer-join',
      fromId: this.myId,
      meta: this.myMeta,
    } as RTCSignalData);
  }

  private async handleSignal(data: RTCSignalData) {
    const { type, fromId, sdp, candidate, meta, toId } = data;

    // Ignore messages not addressed to us (when toId is specified)
    if (toId && toId !== this.myId) return;

    switch (type) {
      case 'peer-join':
        // New peer joined — we initiate offer to them
        if (!this.peerConnections.has(fromId)) {
          await this.createPeerAndOffer(fromId, meta || { name: fromId, avatarUrl: '' });
        }
        break;

      case 'offer':
        await this.handleOffer(fromId, sdp!, meta || { name: fromId, avatarUrl: '' });
        break;

      case 'answer':
        await this.handleAnswer(fromId, sdp!);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(fromId, candidate!);
        break;

      case 'peer-leave':
        this.closePeer(fromId);
        this.onPeerLeave?.(fromId);
        break;
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.ICE_SERVERS });

    // Add local tracks
    this.localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream!);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.remoteStreams.set(peerId, stream);
        const meta = this.announcedPeers.has(peerId)
          ? { name: peerId, avatarUrl: '' }
          : { name: peerId, avatarUrl: '' };
        this.onRemoteStream?.(peerId, stream, meta);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.signalingTopic) {
        cloudRelay.publish(this.signalingTopic, {
          type: 'ice-candidate',
          fromId: this.myId,
          toId: peerId,
          candidate: event.candidate.toJSON(),
        } as RTCSignalData);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.closePeer(peerId);
        this.onPeerLeave?.(peerId);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  private async createPeerAndOffer(peerId: string, meta: { name: string; avatarUrl: string }) {
    const pc = this.createPeerConnection(peerId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      cloudRelay.publish(this.signalingTopic!, {
        type: 'offer',
        fromId: this.myId,
        toId: peerId,
        sdp: pc.localDescription?.toJSON(),
        meta: this.myMeta,
      } as RTCSignalData);
    } catch (e) {
      console.warn('[WebRTC] createOffer failed:', e);
    }
  }

  private async handleOffer(fromId: string, sdp: RTCSessionDescriptionInit, meta: { name: string; avatarUrl: string }) {
    let pc = this.peerConnections.get(fromId);
    if (!pc) pc = this.createPeerConnection(fromId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      cloudRelay.publish(this.signalingTopic!, {
        type: 'answer',
        fromId: this.myId,
        toId: fromId,
        sdp: pc.localDescription?.toJSON(),
        meta: this.myMeta,
      } as RTCSignalData);
    } catch (e) {
      console.warn('[WebRTC] handleOffer failed:', e);
    }
  }

  private async handleAnswer(fromId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(fromId);
    if (!pc) return;
    try {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    } catch (e) {
      console.warn('[WebRTC] handleAnswer failed:', e);
    }
  }

  private async handleIceCandidate(fromId: string, candidateInit: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(fromId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (e) {}
  }

  private closePeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
  }

  /** Replace all local tracks (e.g. when switching from mic to screen share) */
  async replaceLocalStream(newStream: MediaStream) {
    this.localStream = newStream;

    for (const [, pc] of this.peerConnections) {
      const senders = pc.getSenders();
      for (const track of newStream.getTracks()) {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          await sender.replaceTrack(track).catch(() => {});
        } else {
          pc.addTrack(track, newStream);
        }
      }
    }
  }

  cleanup() {
    if (this.signalingTopic && this.myId) {
      cloudRelay.publish(this.signalingTopic, {
        type: 'peer-leave',
        fromId: this.myId,
      } as RTCSignalData);
    }
    this.unsubSignaling?.();
    this.unsubSignaling = null;
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.signalingTopic = null;
    this.myId = '';
  }

  getRemoteStreams() {
    return this.remoteStreams;
  }
}

export const webRTCManager = new WebRTCManager();
export default webRTCManager;
