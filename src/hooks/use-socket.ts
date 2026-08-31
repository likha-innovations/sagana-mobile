import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getSocket, getSocketUrl } from '@/lib/socket';
import { deviceApi } from '@/api/device.api';
import { SocketPongResponse, MqttPingPongEvent, RealtimeEventLog } from '@/types';
import { logger } from '@/lib/logger';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [logs, setLogs] = useState<RealtimeEventLog[]>([]);
  const [latestPong, setLatestPong] = useState<SocketPongResponse | null>(null);
  const [latestMqtt, setLatestMqtt] = useState<MqttPingPongEvent | null>(null);
  const pingTimestampRef = useRef<number | null>(null);

  const addLog = useCallback((log: Omit<RealtimeEventLog, 'id'>) => {
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

    const onMqttPing = (data: MqttPingPongEvent) => {
      setLatestMqtt(data);
      addLog({
        type: 'mqtt-ping',
        title: 'MQTT Ping Bridged',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    };

    const onMqttPong = (data: MqttPingPongEvent) => {
      setLatestMqtt(data);
      addLog({
        type: 'mqtt-pong',
        title: 'MQTT Pong Bridged',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('pong', onPong);
    socket.on('mqtt:ping', onMqttPing);
    socket.on('mqtt:pong', onMqttPong);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('pong', onPong);
      socket.off('mqtt:ping', onMqttPing);
      socket.off('mqtt:pong', onMqttPong);
    };
  }, [addLog]);

  const sendSocketPing = useCallback(
    (customText?: string) => {
      const socket = getSocket();
      if (!socket.connected) {
        logger.warn('Cannot send ping: Socket is not connected', 'useSocket');
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

  const mqttCommandMutation = useMutation({
    mutationFn: async ({ deviceId, action }: { deviceId: string; action: string }) => {
      return deviceApi.sendCommand(deviceId, {
        action,
        payload: { source: 'sagana-mobile-test', sentAt: new Date().toISOString() },
      });
    },
    onSuccess: (data) => {
      addLog({
        type: 'mqtt-ping',
        title: `MQTT Command Sent (${data.action})`,
        payload: data,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (err: Error) => {
      addLog({
        type: 'error',
        title: 'MQTT Command Failed',
        payload: { error: err.message },
        timestamp: new Date().toISOString(),
      });
    },
  });

  const clearLogs = useCallback(() => {
    setLogs([]);
    setLatestPong(null);
    setLatestMqtt(null);
  }, []);

  return {
    isConnected,
    socketId,
    latency,
    logs,
    latestPong,
    latestMqtt,
    socketUrl: getSocketUrl(),
    sendSocketPing,
    sendMqttCommand: mqttCommandMutation.mutate,
    isSendingMqtt: mqttCommandMutation.isPending,
    clearLogs,
  };
}
