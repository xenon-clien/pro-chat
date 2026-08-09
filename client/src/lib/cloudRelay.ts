/**
 * ProChat Cloud Realtime Relay
 * Pure TypeScript MQTT 3.1.1 over WebSockets client with proper variable-length encoding.
 * Enables real-time messaging, presence, and soundboard across all devices worldwide.
 */

type MessageHandler = (topic: string, data: any) => void;

/**
 * MQTT variable-length encoding (handles payloads > 127 bytes correctly).
 * Without this, any JSON message > 127 bytes gets silently dropped by the broker.
 */
function encodeRemainingLength(len: number): number[] {
  const result: number[] = [];
  do {
    let byte = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) byte |= 0x80; // set continuation bit
    result.push(byte);
  } while (len > 0);
  return result;
}

class CloudRealtimeRelay {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private subscribers = new Map<string, Set<MessageHandler>>();
  private clientId = 'prochat_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private pendingQueue: Array<{ topic: string; data: any }> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      // Free public high-availability MQTT broker over secure WebSocket
      this.ws = new WebSocket('wss://broker.emqx.io:8084/mqtt', 'mqttv3.1.1');
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.sendConnectPacket();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
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

    // MQTT 3.1.1 CONNECT packet
    const protocol = [0, 4, 77, 81, 84, 84]; // "MQTT"
    const version = [4]; // protocol level 3.1.1
    const flags = [2]; // clean session
    const keepAlive = [0, 60]; // 60 seconds

    const clientIdBytes = new TextEncoder().encode(this.clientId);
    const clientIdLen = [Math.floor(clientIdBytes.length / 256), clientIdBytes.length % 256];

    const varHeader = [...protocol, ...version, ...flags, ...keepAlive];
    const payload = [...clientIdLen, ...Array.from(clientIdBytes)];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x10, ...remainLenBytes, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }

  private handleMessage(data: ArrayBuffer) {
    const bytes = new Uint8Array(data);
    if (bytes.length < 2) return;

    const packetType = bytes[0] >> 4;

    // CONNACK
    if (packetType === 2) {
      if (bytes[3] === 0) {
        this.isConnected = true;
        this.startPing();
        // Resubscribe to all previously subscribed topics
        this.subscribers.forEach((_, topic) => {
          this.sendSubscribePacket(topic);
        });
        // Flush pending publish queue
        const queued = [...this.pendingQueue];
        this.pendingQueue = [];
        queued.forEach(({ topic, data }) => this.publish(topic, data));
      }
      return;
    }

    // PUBLISH received
    if (packetType === 3) {
      let offset = 1;

      // Decode variable-length remaining length
      let remainLen = 0;
      let multiplier = 1;
      let digit: number;
      do {
        if (offset >= bytes.length) return;
        digit = bytes[offset++];
        remainLen += (digit & 0x7F) * multiplier;
        multiplier *= 128;
      } while ((digit & 0x80) !== 0 && multiplier <= 128 * 128 * 128);

      if (offset + 2 > bytes.length) return;
      const topicLen = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;

      if (offset + topicLen > bytes.length) return;
      const topicBytes = bytes.subarray(offset, offset + topicLen);
      const topic = new TextDecoder().decode(topicBytes);
      offset += topicLen;

      const payloadBytes = bytes.subarray(offset);
      const payloadStr = new TextDecoder().decode(payloadBytes);

      try {
        const parsed = JSON.parse(payloadStr);
        const handlers = this.subscribers.get(topic);
        if (handlers) {
          handlers.forEach((h) => h(topic, parsed));
        }
      } catch (e) {
        // Not JSON — ignore
      }
    }
  }

  private sendSubscribePacket(topic: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConnected) return;

    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];
    const packetId = [0, Math.floor(Math.random() * 65535) + 1]; // random non-zero packet ID
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
        this.ws.send(new Uint8Array([0xC0, 0x00]).buffer); // PINGREQ
      }
    }, 20000);
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
    }, 3000);
  }

  public subscribe(topic: string, handler: MessageHandler) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler);

    if (this.isConnected) {
      this.sendSubscribePacket(topic);
    }

    return () => {
      const set = this.subscribers.get(topic);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.subscribers.delete(topic);
        }
      }
    };
  }

  public publish(topic: string, data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConnected) {
      // Queue the message and reconnect
      this.pendingQueue.push({ topic, data });
      this.connect();
      return;
    }

    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];
    const payloadBytes = new TextEncoder().encode(JSON.stringify(data));

    const varHeader = [...topicLen, ...Array.from(topicBytes)];
    const payload = [...Array.from(payloadBytes)];

    // ✅ FIXED: Proper MQTT variable-length encoding (handles payloads > 127 bytes)
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
