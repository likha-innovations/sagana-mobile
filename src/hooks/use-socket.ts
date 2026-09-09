import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, getSocketUrl } from '@/lib/socket';
import { SocketPongResponse, RealtimeEventLog } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useSocket');

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [logs, setLogs] = useState<RealtimeEventLog[]>([]);
  const [latestPong, setLatestPong] = useState<SocketPongResponse | null>(null);
  const pingTimestampRef = useRef<number | null>(null);

  const addLog = useCallback((log: Omit<RealtimeEventLog, 'id'>) => {
    logger.info(log.title, log.payload);

    const newEntry: RealtimeEventLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
      setSocketId(socket.id || null);
    }

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || null);
      addLog({
        type: 'socket-ping',
        title: 'Socket.IO Connected',
        payload: { socketId: socket.id, url: getSocketUrl() },
        timestamp: new Date().toISOString(),
      });
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      setSocketId(null);
      addLog({
        type: 'error',
        title: 'Socket.IO Disconnected',
        payload: { reason },
        timestamp: new Date().toISOString(),
      });
    };

    const onConnectError = (err: Error) => {
      setIsConnected(false);
      addLog({
        type: 'error',
        title: 'Connection Error',
        payload: { message: err.message },
        timestamp: new Date().toISOString(),
      });
    };

    const onPong = (data: SocketPongResponse) => {
      const now = Date.now();
      const roundtrip = pingTimestampRef.current ? now - pingTimestampRef.current : undefined;
      if (roundtrip !== undefined) {
        setLatency(roundtrip);
      }
      setLatestPong(data);
      addLog({
        type: 'socket-pong',
        title: 'Socket.IO Pong Received',
        payload: data,
        timestamp: new Date().toISOString(),
        latencyMs: roundtrip,
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('pong', onPong);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('pong', onPong);
    };
  }, [addLog]);

  const sendSocketPing = useCallback(
    (customText?: string) => {
      const socket = getSocket();
      if (!socket.connected) {
        logger.warn('Cannot send ping: Socket is not connected');
        return false;
      }

      pingTimestampRef.current = Date.now();
      const payload = {
        message: customText || 'Ping from Mobile',
        clientTimestamp: new Date().toISOString(),
      };

      socket.emit('ping', payload);
      addLog({
        type: 'socket-ping',
        title: 'Socket.IO Ping Sent',
        payload,
        timestamp: new Date().toISOString(),
      });

      return true;
    },
    [addLog]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    setLatestPong(null);
  }, []);

  return {
    isConnected,
    socketId,
    latency,
    logs,
    latestPong,
    socketUrl: getSocketUrl(),
    sendSocketPing,
    clearLogs,
  };
}
