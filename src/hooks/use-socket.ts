import { useState, useEffect, useCallback } from 'react';
import { getSocket, getSocketUrl } from '@/lib/socket';
import { TelemetryData, RealtimeEventLog } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useSocket');

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData | null>(null);
  const [logs, setLogs] = useState<RealtimeEventLog[]>([]);

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
        type: 'connection',
        title: 'Socket.IO Connected',
        payload: { socketId: socket.id, url: getSocketUrl() },
        timestamp: new Date().toISOString(),
      });
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      setSocketId(null);
      addLog({
        type: 'connection',
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

    const onTelemetry = (data: unknown) => {
      const telemetryPayload = typeof data === 'object' && data !== null
        ? (data as TelemetryData)
        : { raw: data };

      setLatestTelemetry(telemetryPayload);
      addLog({
        type: 'telemetry',
        title: 'Live Telemetry Received',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('telemetry', onTelemetry);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('telemetry', onTelemetry);
    };
  }, [addLog]);

  // Dispatches custom command from mobile to backend -> HiveMQ sagana/commands
  const sendCommand = useCallback(
    (commandData: string | object) => {
      const socket = getSocket();
      if (!socket.connected) {
        logger.warn('Cannot send command: Socket is disconnected');
        return false;
      }

      let payload: unknown = commandData;
      if (typeof commandData === 'string') {
        try {
          payload = JSON.parse(commandData);
        } catch {
          payload = { message: commandData };
        }
      }

      socket.emit('command', payload);
      addLog({
        type: 'command',
        title: 'Command Dispatched to HiveMQ',
        payload,
        timestamp: new Date().toISOString(),
      });

      return true;
    },
    [addLog]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isConnected,
    socketId,
    latestTelemetry,
    logs,
    socketUrl: getSocketUrl(),
    sendCommand,
    clearLogs,
  };
}
