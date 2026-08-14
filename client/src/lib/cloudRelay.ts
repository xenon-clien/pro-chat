/**
 * ProChat Robust Multi-Broker Cloud Relay & Global Real-Time Mesh
 * Concurrently bridges multiple public MQTT WebSocket brokers (EMQX, HiveMQ, Mosquitto)
 * + HTML5 BroadcastChannel for 0ms cross-tab and 100% resilient cross-laptop synchronization.
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

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://public.mqtthq.com:8084/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

class CloudRealtimeRelay {
  private sockets: WebSocket[] = [];
  private subscribers = new Map<string, Set<MessageHandler>>();
  private clientId = 'prochat_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  private pingInterval: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private seenMsgIds = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBroadcastChannel();
      this.connectAll();
      this.startKeepAlive();
    }
  }

  private initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('prochat_mesh_channel');
        this.broadcastChannel.onmessage = (event) => {
          const { topic, data, senderId, msgId } = event.data || {};
          if (topic && data && senderId !== this.clientId) {
            if (msgId && this.seenMsgIds.has(msgId)) return;
            if (msgId) this.seenMsgIds.add(msgId);
            this.dispatchMessage(topic, data);
          }
        };
      }
    } catch (e) {}
  }

  private connectAll() {
    BROKERS.forEach((url) => {
      this.connectBroker(url);
    });
  }

  private connectBroker(url: string) {
    try {
      const ws = new WebSocket(url, 'mqttv3.1.1');
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        this.sendConnectPacket(ws);
      };

      ws.onmessage = (event) => {
        this.handleRawFrame(ws, event.data);
      };

      ws.onclose = () => {
        this.sockets = this.sockets.filter((s) => s !== ws);
        setTimeout(() => this.connectBroker(url), 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      setTimeout(() => this.connectBroker(url), 4000);
    }
  }

  private sendConnectPacket(ws: WebSocket) {
    if (ws.readyState !== WebSocket.OPEN) return;

    const protocol = [0, 4, 77, 81, 84, 84]; // "MQTT"
    const version = [4]; // level 3.1.1
    const flags = [2]; // clean session
    const keepAlive = [0, 30]; // 30s

    const clientIdBytes = new TextEncoder().encode(this.clientId + '_' + Math.random().toString(36).substring(2, 6));
    const clientIdLen = [Math.floor(clientIdBytes.length / 256), clientIdBytes.length % 256];

    const varHeader = [...protocol, ...version, ...flags, ...keepAlive];
    const payload = [...clientIdLen, ...Array.from(clientIdBytes)];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x10, ...remainLenBytes, ...varHeader, ...payload]);
    ws.send(packet.buffer);
  }

  private handleRawFrame(ws: WebSocket, data: ArrayBuffer) {
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
        if (!this.sockets.includes(ws)) {
          this.sockets.push(ws);
        }
        // Resubscribe to all active topics
        this.subscribers.forEach((_, topic) => {
          this.sendSubscribePacket(ws, topic);
        });
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
              // Deduplicate using msgId or senderId
              const msgId = parsed?._msgId || parsed?.msgId;
              if (msgId) {
                if (this.seenMsgIds.has(msgId)) {
                  cursor = packetEnd;
                  continue;
                }
                this.seenMsgIds.add(msgId);
                // Keep set bounded
                if (this.seenMsgIds.size > 1000) {
                  const first = this.seenMsgIds.values().next().value;
                  if (first) this.seenMsgIds.delete(first);
                }
              }

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
          } catch (err) {}
        });
      }
    });
  }

  private sendSubscribePacket(ws: WebSocket, topic: string) {
    if (ws.readyState !== WebSocket.OPEN) return;

    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];

    const pid = Math.floor(Math.random() * 65534) + 1;
    const packetId = [Math.floor(pid / 256), pid % 256];
    const qos = [0];

    const varHeader = [...packetId];
    const payload = [...topicLen, ...Array.from(topicBytes), ...qos];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x82, ...remainLenBytes, ...varHeader, ...payload]);
    ws.send(packet.buffer);
  }

  private startKeepAlive() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(new Uint8Array([0xc0, 0x00]).buffer);
        }
      });
    }, 12000);
  }

  public subscribe(topic: string, handler: MessageHandler) {
    const norm = topic.toLowerCase().trim();
    if (!this.subscribers.has(norm)) {
      this.subscribers.set(norm, new Set());
    }
    this.subscribers.get(norm)!.add(handler);

    this.sockets.forEach((ws) => {
      this.sendSubscribePacket(ws, topic);
    });

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
    const msgId = 'msg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const payloadWithMeta = { ...data, _senderId: this.clientId, _msgId: msgId };

    // 1. Broadcast locally
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          topic,
          data: payloadWithMeta,
          senderId: this.clientId,
          msgId,
        });
      } catch (e) {}
    }

    // 2. Publish to all active cloud sockets
    const topicBytes = new TextEncoder().encode(topic);
    const topicLen = [Math.floor(topicBytes.length / 256), topicBytes.length % 256];
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadWithMeta));

    const varHeader = [...topicLen, ...Array.from(topicBytes)];
    const payload = [...Array.from(payloadBytes)];
    const remainLenBytes = encodeRemainingLength(varHeader.length + payload.length);

    const packet = new Uint8Array([0x30, ...remainLenBytes, ...varHeader, ...payload]);

    this.sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(packet.buffer);
      }
    });
  }
}

export const cloudRelay = new CloudRealtimeRelay();
export default cloudRelay;
