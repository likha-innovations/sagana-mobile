import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/api/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SocketClient');

let socketInstance: Socket | null = null;

export function getSocketUrl(): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/telemetry`;
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = getSocketUrl();
    logger.info(`Initializing Socket.IO connection to: ${url}`);

    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      logger.info(`Connected to telemetry gateway. ID: ${socketInstance?.id}`);
    });

    socketInstance.on('disconnect', (reason) => {
      logger.warn(`Disconnected from telemetry gateway. Reason: ${reason}`);
    });

    socketInstance.on('connect_error', (err) => {
      logger.error(`Connection error: ${err.message}`, err);
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    logger.info('Socket connection destroyed');
  }
}
