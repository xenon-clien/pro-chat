/**
 * ProChat Dual Real-Time Cloud Relay
 * Combines MQTT WebSocket relay (for cross-device / cross-network peers)
 * + HTML5 BroadcastChannel (for 0ms instant cross-tab sync on same machine/browser).
 */

type MessageHandler = (topic: string, data: any) => void;

function encodeRemainingLength(len: number): number[] {
  const result: number[] = [];
  do {
    let byte = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) byte |= 0x80;
    result.push(byte);
  } while (len > 0);
  return result;
}

class CloudRealtimeRelay {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private subscribers = new Map<string, Set<MessageHandler>>();
  private clientId = 'prochat_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private pendingQueue: Array<{ topic: string; data: any }> = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBroadcastChannel();
      this.connect();
    }
  }

  private initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('prochat_local_realtime_mesh');
        this.broadcastChannel.onmessage = (event) => {
          const { topic, data, senderId } = event.data || {};
          if (topic && data && senderId !== this.clientId) {
            this.dispatchMessage(topic, data);
          }
        };
      }
    } catch (e) {
      console.warn('[CloudRelay] BroadcastChannel not supported:', e);
    }
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket('wss://broker.emqx.io:8084/mqtt', 'mqttv3.1.1');
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.sendConnectPacket();
      };

      this.ws.onmessage = (event) => {
        this.handleRawFrame(event.data);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.cleanupPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private sendConnectPacket() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const protocol = [0, 4, 77, 81, 84, 84]; // "MQTT"
    const version = [4]; // level 3.1.1
    const flags = [2]; // clean session
    const keepAlive = [0, 30]; // 30s

    const clientIdBytes = new TextEncoder().encode(this.clientId);
    const clientIdLen = [Math.floor(clientIdBytes.length / 256), clientIdBytes.length % 256];

    const varHeader = [...protocol, ...version, ...flags, ...keepAlive];
    const payload = [...clientIdLen, ...Array.from(clientIdBytes)];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x10, ...remainLenBytes, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }

  private handleRawFrame(data: ArrayBuffer) {
    const bytes = new Uint8Array(data);
    let cursor = 0;

    while (cursor < bytes.length) {
      const headerByte = bytes[cursor++];
      const packetType = headerByte >> 4;

      let remainLen = 0;
      let multiplier = 1;
      let digit: number;
      do {
        if (cursor >= bytes.length) return;
        digit = bytes[cursor++];
        remainLen += (digit & 0x7f) * multiplier;
        multiplier *= 128;
      } while ((digit & 0x80) !== 0 && multiplier <= 128 * 128 * 128);

      const packetEnd = cursor + remainLen;
      if (packetEnd > bytes.length) break;

      // CONNACK (Type 2)
      if (packetType === 2) {
        this.isConnected = true;
        this.startPing();

        this.subscribers.forEach((_, topic) => {
          this.sendSubscribePacket(topic);
        });

        const queued = [...this.pendingQueue];
        this.pendingQueue = [];
        queued.forEach(({ topic, data: d }) => this.publish(topic, d));
      }
      // PUBLISH (Type 3)
      else if (packetType === 3) {
        let pOffset = cursor;
        if (pOffset + 2 <= packetEnd) {
          const topicLen = (bytes[pOffset] << 8) | bytes[pOffset + 1];
          pOffset += 2;

          if (pOffset + topicLen <= packetEnd) {
            const topicBytes = bytes.subarray(pOffset, pOffset + topicLen);
            const rawTopic = new TextDecoder().decode(topicBytes);
            pOffset += topicLen;

            const payloadBytes = bytes.subarray(pOffset, packetEnd);
            const payloadStr = new TextDecoder().decode(payloadBytes);

            try {
              const parsed = JSON.parse(payloadStr);
              this.dispatchMessage(rawTopic, parsed);
            } catch (e) {}
          }
        }
      }

      cursor = packetEnd;
    }
  }

  private dispatchMessage(rawTopic: string, data: any) {
    const normalizedTopic = rawTopic.toLowerCase().trim();

    this.subscribers.forEach((handlers, subTopic) => {
      const normalizedSub = subTopic.toLowerCase().trim();
      if (normalizedSub === normalizedTopic) {
        handlers.forEach((h) => {
          try {
            h(rawTopic, data);
          } catch (err) {
            console.warn('[CloudRelay] Handler error:', err);
          }
        });
      }
    });
  }

  private sendSubscribePacket(topic: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConnected) return;

    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];

    const pid = Math.floor(Math.random() * 65534) + 1;
    const packetId = [Math.floor(pid / 256), pid % 256];
    const qos = [0];

    const varHeader = [...packetId];
    const payload = [...topicLen, ...Array.from(topicBytes), ...qos];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x82, ...remainLenBytes, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }

  private startPing() {
    this.cleanupPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isConnected) {
        this.ws.send(new Uint8Array([0xc0, 0x00]).buffer);
      }
    }, 15000);
  }

  private cleanupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  public subscribe(topic: string, handler: MessageHandler) {
    const norm = topic.toLowerCase().trim();
    if (!this.subscribers.has(norm)) {
      this.subscribers.set(norm, new Set());
    }
    this.subscribers.get(norm)!.add(handler);

    if (this.isConnected) {
      this.sendSubscribePacket(topic);
    }

    return () => {
      const set = this.subscribers.get(norm);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.subscribers.delete(norm);
        }
      }
    };
  }

  public publish(topic: string, data: any) {
    // 1. Broadcast locally across tabs with 0ms delay
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          topic,
          data,
          senderId: this.clientId,
        });
      } catch (e) {}
    }

    // 2. Publish to cloud WebSocket relay for remote devices
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConnected) {
      this.pendingQueue.push({ topic, data });
      this.connect();
      return;
    }

    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];
    const payloadBytes = new TextEncoder().encode(JSON.stringify(data));

    const varHeader = [...topicLen, ...Array.from(topicBytes)];
    const payload = [...Array.from(payloadBytes)];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x30, ...remainLenBytes, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }

  public getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnected) return 'connected';
    if (this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

export const cloudRelay = new CloudRealtimeRelay();
export default cloudRelay;
