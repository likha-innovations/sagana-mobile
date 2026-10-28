import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, getSocketUrl, disconnectSocket } from '@/lib/socket';
import { TelemetryData, RealtimeEventLog } from '@/types';
import type { Machine } from '@/types/machine';
import { useAuthContext } from '@/context/auth-context';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useSocket');

export function useSocket() {
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuthContext();
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
    if (!isSignedIn) {
      disconnectSocket();
      setIsConnected(false);
      setSocketId(null);
      return;
    }

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

    const onStatus = (data: unknown) => {
      const payload = data as { machineId?: string; macAddress?: string; status?: string };
      if (!payload?.status) return;

      const normalizedStatus: Machine['status'] =
        payload.status === 'online' || payload.status === 'active' ? 'active' : 'offline';

      // Instantly update machine in cached list for 0ms latency UI flip
      queryClient.setQueriesData<Machine[]>({ queryKey: ['machines'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m) =>
          (payload.machineId && m.id === payload.machineId) ||
          (payload.macAddress && m.mac_address === payload.macAddress)
            ? { ...m, status: normalizedStatus }
            : m,
        );
      });

      // Update machine detail query if currently viewed
      queryClient.setQueriesData<Machine>({ queryKey: ['machines'] }, (old) => {
        if (!old || Array.isArray(old)) return old;
        if (
          (payload.machineId && old.id === payload.machineId) ||
          (payload.macAddress && old.mac_address === payload.macAddress)
        ) {
          return { ...old, status: normalizedStatus };
        }
        return old;
      });

      // Invalidate queries to ensure background consistency with DB
      queryClient.invalidateQueries({ queryKey: ['machines'] });

      addLog({
        type: 'connection',
        title: `Machine status changed: ${normalizedStatus}`,
        payload,
        timestamp: new Date().toISOString(),
      });
    };

    const onTelemetry = (data: unknown) => {
      const telemetryPayload = typeof data === 'object' && data !== null
        ? (data as TelemetryData)
        : { raw: data };

      setLatestTelemetry(telemetryPayload);

      // If telemetry is received, device is active & update latest sensor readings
      if (telemetryPayload && typeof telemetryPayload === 'object' && 'macAddress' in telemetryPayload) {
        const payloadObj = telemetryPayload as Record<string, unknown>;
        const mac = payloadObj.macAddress as string | undefined;
        if (mac) {
          const bme = payloadObj.bme280 as { temp?: number } | undefined;
          const ds = payloadObj.ds18b20 as { probe1?: number } | undefined;
          const scd = payloadObj.scd41 as { co2?: number } | undefined;
          const moist = payloadObj.moisture as { sensor1?: number } | undefined;

          const tempVal =
            typeof bme?.temp === 'number'
              ? bme.temp
              : typeof ds?.probe1 === 'number'
                ? ds.probe1
                : typeof payloadObj.temperature === 'number'
                  ? (payloadObj.temperature as number)
                  : undefined;

          const moistVal =
            typeof moist?.sensor1 === 'number'
              ? moist.sensor1
              : typeof payloadObj.moisture === 'number'
                ? (payloadObj.moisture as number)
                : undefined;

          const o2Val =
            typeof payloadObj.o2 === 'number'
              ? (payloadObj.o2 as number)
              : typeof payloadObj.oxygen === 'number'
                ? (payloadObj.oxygen as number)
                : undefined;

          const co2Val =
            typeof scd?.co2 === 'number'
              ? scd.co2
              : typeof payloadObj.co2 === 'number'
                ? (payloadObj.co2 as number)
                : undefined;

          queryClient.setQueriesData<Machine[]>({ queryKey: ['machines'] }, (old) => {
            if (!old || !Array.isArray(old)) return old;
            return old.map((m) => {
              if (m.mac_address === mac) {
                return {
                  ...m,
                  status: 'active',
                  latest_readings: {
                    temperature: tempVal ?? m.latest_readings?.temperature ?? 0,
                    moisture: moistVal ?? m.latest_readings?.moisture ?? 0,
                    oxygen: o2Val ?? m.latest_readings?.oxygen ?? 0,
                    co2: co2Val ?? m.latest_readings?.co2 ?? 0,
                    updated_at: new Date().toISOString(),
                  },
                };
              }
              return m;
            });
          });

          queryClient.setQueriesData<Machine>({ queryKey: ['machines'] }, (old) => {
            if (!old || Array.isArray(old)) return old;
            if (old.mac_address === mac) {
              return {
                ...old,
                status: 'active',
                latest_readings: {
                  temperature: tempVal ?? old.latest_readings?.temperature ?? 0,
                  moisture: moistVal ?? old.latest_readings?.moisture ?? 0,
                  oxygen: o2Val ?? old.latest_readings?.oxygen ?? 0,
                  co2: co2Val ?? old.latest_readings?.co2 ?? 0,
                  updated_at: new Date().toISOString(),
                },
              };
            }
            return old;
          });
        }
      }

      addLog({
        type: 'telemetry',
        title: 'Live Telemetry Received',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    };

    const onMachineUpdated = (data: unknown) => {
      const payload = data as { machineId?: string; name?: string };
      if (!payload?.machineId) return;

      // Patch the machine name in the list cache without waiting for a network round-trip
      queryClient.setQueriesData<Machine[]>({ queryKey: ['machines'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m) =>
          m.id === payload.machineId && payload.name !== undefined
            ? { ...m, name: payload.name! }
            : m,
        );
      });

      // Patch the detail cache if the renamed machine is currently open
      queryClient.setQueriesData<Machine>({ queryKey: ['machines'] }, (old) => {
        if (!old || Array.isArray(old)) return old;
        if (old.id === payload.machineId && payload.name !== undefined) {
          return { ...old, name: payload.name! };
        }
        return old;
      });

      addLog({
        type: 'connection',
        title: `Machine renamed: ${payload.name ?? payload.machineId}`,
        payload,
        timestamp: new Date().toISOString(),
      });
    };

    const onMachineAdded = (data: unknown) => {
      const payload = data as {
        machineId?: string;
        name?: string;
        macAddress?: string;
        barangayId?: string;
        wifiSsid?: string | null;
        status?: string;
        createdAt?: string;
      };
      if (!payload?.machineId || !payload?.macAddress || !payload?.name) return;

      const normalizedStatus: Machine['status'] =
        payload.status === 'active' || payload.status === 'offline' || payload.status === 'maintenance' || payload.status === 'available'
          ? payload.status
          : 'active';

      const newMachine: Machine = {
        id: payload.machineId,
        barangay_id: payload.barangayId ?? '',
        mac_address: payload.macAddress,
        name: payload.name,
        status: normalizedStatus,
        wifi_ssid: payload.wifiSsid ?? null,
        last_seen: null,
        created_at: payload.createdAt ?? new Date().toISOString(),
        removed_at: null,
      };

      // Instantly prepend or append new machine to list cache
      queryClient.setQueriesData<Machine[]>({ queryKey: ['machines'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        if (old.some((m) => m.id === payload.machineId)) return old;
        return [...old, newMachine];
      });

      // Invalidate to synchronize full server state and related queries
      void queryClient.invalidateQueries({ queryKey: ['machines'] });

      addLog({
        type: 'connection',
        title: `Machine added: ${payload.name}`,
        payload,
        timestamp: new Date().toISOString(),
      });
    };

    const onMachineRemoved = (data: unknown) => {
      const payload = data as { machineId?: string };
      if (!payload?.machineId) return;

      // Drop the deleted machine from the list cache instantly
      queryClient.setQueriesData<Machine[]>({ queryKey: ['machines'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((m) => m.id !== payload.machineId);
      });

      // Invalidate so the next background fetch confirms the deletion
      void queryClient.invalidateQueries({ queryKey: ['machines'] });

      addLog({
        type: 'connection',
        title: 'Machine removed from list',
        payload,
        timestamp: new Date().toISOString(),
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('telemetry', onTelemetry);
    socket.on('status', onStatus);
    socket.on('machine_updated', onMachineUpdated);
    socket.on('machine_removed', onMachineRemoved);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('telemetry', onTelemetry);
      socket.off('status', onStatus);
      socket.off('machine_updated', onMachineUpdated);
      socket.off('machine_removed', onMachineRemoved);
    };
  }, [isSignedIn, addLog, queryClient]);

  // Dispatches custom command from mobile to backend -> EMQX commands topic
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
        title: 'Command Dispatched to Broker',
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