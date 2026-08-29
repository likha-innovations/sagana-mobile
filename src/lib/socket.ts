import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/api/client';
import { logger } from '@/lib/logger';

let socketInstance: Socket | null = null;

export function getSocketUrl(): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/telemetry`;
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = getSocketUrl();
    logger.info(`[SOCKET] Initializing Socket.IO connection to: ${url}`, 'SocketClient');

    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      logger.info(`[SOCKET] Connected to telemetry gateway. ID: ${socketInstance?.id}`, 'SocketClient');
    });

    socketInstance.on('disconnect', (reason) => {
      logger.warn(`[SOCKET] Disconnected from telemetry gateway. Reason: ${reason}`, 'SocketClient');
    });

    socketInstance.on('connect_error', (err) => {
      logger.error(`[SOCKET] Connection error: ${err.message}`, err, 'SocketClient');
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    logger.info('[SOCKET] Socket connection destroyed', 'SocketClient');
  }
}
