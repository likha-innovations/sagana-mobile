import { useState, useCallback, useRef, useEffect } from 'react';
import { type Device, type Subscription } from 'react-native-ble-plx';
import {
  bleManager,
  BLE_SERVICE_UUID,
  BLE_WRITE_CHARACTERISTIC_UUID,
  BLE_NOTIFY_CHARACTERISTIC_UUID,
  requestBluetoothPermissions,
  waitForBluetoothReady,
} from '@/lib/bluetooth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useBluetooth');

export type BleStatus =
  | 'idle'
  | 'requesting-permission'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error';

export type ProvisioningStatus =
  | 'idle'
  | 'submitting'
  | 'testing-wifi'
  | 'success'
  | 'failed'
  | 'timeout';

export interface BluetoothState {
  status: BleStatus;
  devices: Device[];
  connectedDevice: Device | null;
  connectingDeviceId: string | null;
  errorMessage: string | null;
  hardwareMac: string | null;
  provisioningStatus: ProvisioningStatus;
  provisioningError: string | null;
  startScan: () => Promise<void>;
  connectToDevice: (device: Device) => Promise<boolean>;
  writeCredentials: (ssid: string, password: string) => Promise<void>;
  provisionWifi: (ssid: string, password: string) => Promise<string | undefined>;
  writeMachineName: (name: string, userId?: string) => Promise<void>;
  clearProvisioningError: () => void;
  disconnect: () => Promise<void>;
  reset: () => void;
}

export function useBluetooth(): BluetoothState {
  const [status, setStatus] = useState<BleStatus>('idle');
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hardwareMac, setHardwareMac] = useState<string | null>(null);
  const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStatus>('idle');
  const [provisioningError, setProvisioningError] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const notifySubscriptionRef = useRef<Subscription | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProvisionRef = useRef<{
    resolve: (macAddress?: string) => void;
    reject: (err: Error) => void;
  } | null>(null);
  const isRegistrationCompleteRef = useRef(false);

  const clearProvisioningTimeout = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const cleanupNotificationSubscription = useCallback(() => {
    if (notifySubscriptionRef.current) {
      notifySubscriptionRef.current.remove();
      notifySubscriptionRef.current = null;
    }
  }, []);

  const startScan = useCallback(async () => {
    setStatus('requesting-permission');
    setErrorMessage(null);
    setDevices([]);
    setConnectedDevice(null);
    setHardwareMac(null);
    deviceRef.current = null;

    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      setErrorMessage('Bluetooth permissions are required to find your machine.');
      setStatus('error');
      return;
    }

    const bleOn = await waitForBluetoothReady();
    if (!bleOn) {
      setErrorMessage('Bluetooth is off. Please enable it and try again.');
      setStatus('error');
      return;
    }

    logger.info('Starting BLE scan for AIVSP machines');
    setStatus('scanning');

    bleManager.startDeviceScan([BLE_SERVICE_UUID], null, (error, scannedDevice) => {
      if (error) {
        logger.error('BLE scan error', error);
        setErrorMessage('Failed to scan for devices. Please try again.');
        setStatus('error');
        return;
      }

      if (scannedDevice) {
        setDevices((prev) => {
          if (prev.find((d) => d.id === scannedDevice.id)) return prev;
          return [...prev, scannedDevice];
        });
      }
    });
  }, []);

  const handleNotificationPayload = useCallback((payload: string) => {
    const parts = payload.split(',');
    const statusPart = parts[0]?.trim().toUpperCase() || '';

    if (statusPart === 'SUCCESS' || statusPart.includes('SUCCESS')) {
      const macFromPayload = parts[1]?.trim() || null;
      logger.info('Provisioning succeeded according to ESP32 notification', { macFromPayload });
      setHardwareMac(macFromPayload);
      setProvisioningStatus('success');
      setProvisioningError(null);
      clearProvisioningTimeout();
      if (pendingProvisionRef.current) {
        pendingProvisionRef.current.resolve(macFromPayload ?? undefined);
        pendingProvisionRef.current = null;
      }
      return;
    }

    if (statusPart === 'FAILED' || statusPart.includes('FAILED')) {
      logger.warn('Provisioning failed according to ESP32 notification');
      const failureMsg = 'Failed to connect to WiFi. Please check your credentials and try again.';
      setProvisioningStatus('failed');
      setProvisioningError(failureMsg);
      clearProvisioningTimeout();
      if (pendingProvisionRef.current) {
        pendingProvisionRef.current.reject(new Error(failureMsg));
        pendingProvisionRef.current = null;
      }
      return;
    }

    logger.info('Unhandled BLE notification payload', { payload });
  }, [clearProvisioningTimeout]);

  const connectToDevice = useCallback(async (device: Device) => {
    bleManager.stopDeviceScan();
    setConnectingDeviceId(device.id);
    setStatus('connecting');
    setErrorMessage(null);
    setHardwareMac(null);
    setProvisioningError(null);
    setProvisioningStatus('idle');
    isRegistrationCompleteRef.current = false;

    try {
      const connected = await device.connect();
      // Default BLE ATT payload is 20 bytes; SUCCESS,<MAC> is 26 — request larger MTU first
      await connected.requestMTU(512);
      await connected.discoverAllServicesAndCharacteristics();
      deviceRef.current = connected;
      setConnectedDevice(connected);
      setConnectingDeviceId(null);
      setStatus('connected');
      logger.info('Successfully connected to AIVSP device', { id: connected.id });

      cleanupNotificationSubscription();
      notifySubscriptionRef.current = connected.monitorCharacteristicForService(
        BLE_SERVICE_UUID,
        BLE_NOTIFY_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            // Expected disconnect only after registration is marked complete
            if (isRegistrationCompleteRef.current) {
              logger.info('ESP32 disconnected cleanly after registration completed');
              return;
            }
            logger.warn('BLE notification error or disconnect', { message: error.message });
            return;
          }

          if (!characteristic?.value) return;

          let decoded = '';
          try {
            decoded = atob(characteristic.value);
          } catch (decodeErr) {
            logger.error('Failed to decode base64 notification value', decodeErr);
            return;
          }

          const payload = decoded.replace(/\0/g, '').trim();
          logger.info('Received notification on BLE_NOTIFY_CHARACTERISTIC', { payload });
          handleNotificationPayload(payload);
        }
      );

      return true;
    } catch (connectError) {
      logger.error('BLE connection failed', connectError);
      setConnectingDeviceId(null);
      setErrorMessage('Could not connect to the selected machine.');
      setStatus('error');
      return false;
    }
  }, [cleanupNotificationSubscription, handleNotificationPayload]);

  const provisionWifi = useCallback(async (ssid: string, password: string): Promise<string | undefined> => {
    const connected = deviceRef.current;
    if (!connected) {
      throw new Error('No device connected');
    }

    const isStillConnected = await connected.isConnected();
    if (!isStillConnected) {
      const disconnectedMsg = 'The machine disconnected unexpectedly.';
      setErrorMessage(disconnectedMsg);
      setStatus('error');
      throw new Error(disconnectedMsg);
    }

    clearProvisioningTimeout();
    setProvisioningError(null);
    setProvisioningStatus('testing-wifi');

    return new Promise<string | undefined>((resolve, reject) => {
      // 30-second fallback safety timeout
      timeoutTimerRef.current = setTimeout(() => {
        logger.warn('Wi-Fi provisioning timed out after 30 seconds');
        timeoutTimerRef.current = null;
        pendingProvisionRef.current = null;
        const timeoutMsg = 'Wi-Fi connection timed out. Please check your network and try again.';
        setProvisioningStatus('timeout');
        setProvisioningError(timeoutMsg);
        reject(new Error(timeoutMsg));
      }, 30000);

      pendingProvisionRef.current = {
        resolve: (mac?: string) => resolve(mac),
        reject: (err: Error) => reject(err),
      };

      const credentialsString = `${ssid},${password}`;
      const payload = btoa(unescape(encodeURIComponent(credentialsString)));
      logger.info('Writing Wi-Fi credentials to ESP32 write characteristic');

      connected
        .writeCharacteristicWithResponseForService(
          BLE_SERVICE_UUID,
          BLE_WRITE_CHARACTERISTIC_UUID,
          payload
        )
        .catch((writeErr) => {
          logger.error('Failed to write credentials characteristic', writeErr);
          clearProvisioningTimeout();
          pendingProvisionRef.current = null;
          const writeErrMsg = 'Failed to send credentials to the machine. Please try again.';
          setProvisioningStatus('failed');
          setProvisioningError(writeErrMsg);
          reject(new Error(writeErrMsg));
        });
    });
  }, [clearProvisioningTimeout]);

  const writeCredentials = useCallback(async (ssid: string, password: string) => {
    await provisionWifi(ssid, password);
  }, [provisionWifi]);

  const writeMachineName = useCallback(async (name: string, userId?: string): Promise<void> => {
    const connected = deviceRef.current;
    if (!connected) {
      throw new Error('No device connected');
    }

    const isStillConnected = await connected.isConnected();
    if (!isStillConnected) {
      const disconnectedMsg = 'The machine disconnected unexpectedly.';
      setErrorMessage(disconnectedMsg);
      setStatus('error');
      throw new Error(disconnectedMsg);
    }

    // Format payload using NAME:<machine_name>,<userId> or NAME:<machine_name>
    const trimmedName = name.trim();
    const formatted = userId ? `NAME:${trimmedName},${userId.trim()}` : `NAME:${trimmedName}`;
    const payload = btoa(unescape(encodeURIComponent(formatted)));
    logger.info('Writing machine name and user ID to ESP32 write characteristic', { formatted });

    await connected.writeCharacteristicWithResponseForService(
      BLE_SERVICE_UUID,
      BLE_WRITE_CHARACTERISTIC_UUID,
      payload
    );

    // Mark complete since ESP32 cleanly stops BLE service after saving machine name
    isRegistrationCompleteRef.current = true;
    logger.info('Machine name written successfully');
  }, []);

  const clearProvisioningError = useCallback(() => {
    setProvisioningError(null);
    if (provisioningStatus === 'failed' || provisioningStatus === 'timeout') {
      setProvisioningStatus('idle');
    }
  }, [provisioningStatus]);

  const disconnect = useCallback(async () => {
    isRegistrationCompleteRef.current = true;
    clearProvisioningTimeout();
    cleanupNotificationSubscription();
    if (deviceRef.current) {
      try {
        await deviceRef.current.cancelConnection();
      } catch (err) {
        logger.info('BLE disconnect invoked on already closed connection');
      }
      deviceRef.current = null;
    }
    setConnectedDevice(null);
    setHardwareMac(null);
    setStatus('idle');
  }, [clearProvisioningTimeout, cleanupNotificationSubscription]);

  const reset = useCallback(() => {
    isRegistrationCompleteRef.current = true;
    clearProvisioningTimeout();
    cleanupNotificationSubscription();
    pendingProvisionRef.current = null;
    setProvisioningStatus('idle');
    setProvisioningError(null);
    setHardwareMac(null);

    bleManager.stopDeviceScan();
    deviceRef.current?.cancelConnection().catch(() => {});
    deviceRef.current = null;
    setConnectedDevice(null);
    setConnectingDeviceId(null);
    setDevices([]);
    setStatus('idle');
    setErrorMessage(null);
  }, [clearProvisioningTimeout, cleanupNotificationSubscription]);

  useEffect(() => {
    return () => {
      clearProvisioningTimeout();
      cleanupNotificationSubscription();
      bleManager.stopDeviceScan();
      deviceRef.current?.cancelConnection().catch(() => {});
    };
  }, [clearProvisioningTimeout, cleanupNotificationSubscription]);

  return {
    status,
    devices,
    connectedDevice,
    connectingDeviceId,
    errorMessage,
    hardwareMac,
    provisioningStatus,
    provisioningError,
    startScan,
    connectToDevice,
    writeCredentials,
    provisionWifi,
    writeMachineName,
    clearProvisioningError,
    disconnect,
    reset,
  };
}
