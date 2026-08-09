/**
 * ProChat Cloud Realtime Relay
 * Pure TypeScript lightweight MQTT over WebSockets client for global multi-device sync
 * Enables instant real-time messaging, soundboard, and presence across all phones & PCs worldwide.
 */

type MessageHandler = (topic: string, data: any) => void;

class CloudRealtimeRelay {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private subscribers = new Map<string, Set<MessageHandler>>();
  private clientId = 'prochat_' + Math.random().toString(36).substring(2, 10);
  private reconnectTimer: any = null;
  private pingInterval: any = null;

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
      // Free public high-availability secure MQTT WebSocket broker
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

    // Build standard MQTT 3.1.1 CONNECT packet
    const protocol = [0, 4, 77, 81, 84, 84]; // "MQTT"
    const version = [4]; // 3.1.1
    const flags = [2]; // Clean session
    const keepAlive = [0, 60]; // 60 seconds

    const clientIdBytes = new TextEncoder().encode(this.clientId);
    const clientIdLen = [Math.floor(clientIdBytes.length / 256), clientIdBytes.length % 256];

    const varHeader = [...protocol, ...version, ...flags, ...keepAlive];
    const payload = [...clientIdLen, ...Array.from(clientIdBytes)];
    const remainLen = varHeader.length + payload.length;

    const packet = new Uint8Array([0x10, remainLen, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }

  private handleMessage(data: ArrayBuffer) {
    const bytes = new Uint8Array(data);
    if (bytes.length < 2) return;

    const packetType = bytes[0] >> 4;

    // CONNACK (0x02)
    if (packetType === 2) {
      if (bytes[3] === 0) {
        this.isConnected = true;
        this.startPing();
        // Resubscribe to all existing topics
        this.subscribers.forEach((_, topic) => {
          this.sendSubscribePacket(topic);
        });
      }
      return;
    }

    // PUBLISH (0x03)
    if (packetType === 3) {
      let offset = 1;
      let multiplier = 1;
      let remainLen = 0;

      // Decode variable length
      let digit = 0;
      do {
        digit = bytes[offset++];
        remainLen += (digit & 127) * multiplier;
        multiplier *= 128;
      } while ((digit & 128) !== 0 && offset < bytes.length);

      const topicLen = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;

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
        // Not JSON
      }
    }
  }

  private sendSubscribePacket(topic: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConnected) return;

    const packetId = [0, 1];
    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];
    const qos = [0];

    const varHeader = [...packetId];
    const payload = [...topicLen, ...Array.from(topicBytes), ...qos];
    const remainLen = varHeader.length + payload.length;

    const packet = new Uint8Array([0x82, remainLen, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }

  private startPing() {
    this.cleanupPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isConnected) {
        this.ws.send(new Uint8Array([0xC0, 0x00]).buffer); // PINGREQ
      }
    }, 30000);
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
      this.connect();
      setTimeout(() => this.publish(topic, data), 1000);
      return;
    }

    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];
    const payloadBytes = new TextEncoder().encode(JSON.stringify(data));

    const varHeader = [...topicLen, ...Array.from(topicBytes)];
    const payload = [...Array.from(payloadBytes)];
    const remainLen = varHeader.length + payload.length;

    const packet = new Uint8Array([0x30, remainLen, ...varHeader, ...payload]);
    this.ws.send(packet.buffer);
  }
}

export const cloudRelay = new CloudRealtimeRelay();
export default cloudRelay;
