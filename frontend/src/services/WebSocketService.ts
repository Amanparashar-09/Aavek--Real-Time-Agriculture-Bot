import { useRobotStore } from '@/store/useRobotStore';
import { WSMessage } from '@/types';

const WS_URL = 'ws://localhost:8000/ws';
const POLL_URL = '/api/mock-stream';
const RECONNECT_DELAY = 5000;
const POLL_INTERVAL = 1000;

class WebSocketService {
  private ws: WebSocket | null = null;
  private pollInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private isConnecting = false;

  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    
    this.isConnecting = true;
    console.log('🔌 Attempting WebSocket connection to', WS_URL);

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        useRobotStore.getState().setOnline(true);
        this.stopPolling();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, falling back to polling');
        this.isConnecting = false;
        this.ws = null;
        useRobotStore.getState().setOnline(false);
        this.startPolling();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.warn('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.startPolling();
    }
  }

  private handleMessage(message: WSMessage) {
    const store = useRobotStore.getState();

    switch (message.type) {
      case 'telemetry':
        store.updateTelemetry(message.payload as any);
        break;
      case 'vision':
        store.updateVision(message.payload as any);
        break;
      case 'health':
        store.updateHealth(message.payload as any);
        break;
      case 'alert':
        store.addAlert(message.payload as any);
        break;
      case 'mission':
        store.updateMission(message.payload as any);
        break;
      case 'system':
        store.updateSystem(message.payload as any);
        break;
      case 'mode_change':
        store.setMode((message.payload as any).mode);
        break;
    }

    store.setOnline(true);
  }

  private startPolling() {
    if (this.pollInterval) return;

    console.log('🔄 Starting poll fallback');
    this.pollInterval = window.setInterval(async () => {
      try {
        const response = await fetch(POLL_URL);
        if (response.ok) {
          const messages: WSMessage[] = await response.json();
          messages.forEach(msg => this.handleMessage(msg));
        }
      } catch (error) {
        // Polling failed, that's okay in dev mode
      }
    }, POLL_INTERVAL);
  }

  private stopPolling() {
    if (this.pollInterval) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, RECONNECT_DELAY);
  }

  disconnect() {
    this.stopPolling();
    
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    useRobotStore.getState().setOnline(false);
  }

  send(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }
}

export const wsService = new WebSocketService();
