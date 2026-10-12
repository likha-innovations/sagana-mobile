import { useState, useCallback, useRef, useEffect } from 'react';
import { type Device } from 'react-native-ble-plx';
import {
  bleManager,
  BLE_SERVICE_UUID,
  BLE_CHARACTERISTIC_UUID,
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

export interface BluetoothState {
  status: BleStatus;
  devices: Device[];
  connectedDevice: Device | null;
  errorMessage: string | null;
  startScan: () => Promise<void>;
  connectToDevice: (device: Device) => Promise<boolean>;
  writeCredentials: (ssid: string, password: string) => Promise<void>;
  reset: () => void;
}

export function useBluetooth(): BluetoothState {
  const [status, setStatus] = useState<BleStatus>('idle');
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);

  const startScan = useCallback(async () => {
    setStatus('requesting-permission');
    setErrorMessage(null);
    setDevices([]);
    setConnectedDevice(null);
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
          // Prevent duplicates
          if (prev.find((d) => d.id === scannedDevice.id)) return prev;
          return [...prev, scannedDevice];
        });
      }
    });
  }, []);

  const connectToDevice = useCallback(async (device: Device) => {
    bleManager.stopDeviceScan();
    setStatus('connecting');
    setErrorMessage(null);

    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      deviceRef.current = connected;
      setConnectedDevice(connected);
      setStatus('connected');
      logger.info('Successfully connected to AIVSP device', { id: connected.id });
      return true;
    } catch (connectError) {
      logger.error('BLE connection failed', connectError);
      setErrorMessage('Could not connect to the selected machine.');
      setStatus('error');
      return false;
    }
  }, []);

  const writeCredentials = useCallback(async (ssid: string, password: string) => {
    const connected = deviceRef.current;
    if (!connected) {
      throw new Error('No device connected');
    }

    // Verify connection is still alive before writing to prevent "Device is not connected" BleError
    const isStillConnected = await connected.isConnected();
    if (!isStillConnected) {
      setErrorMessage('The machine disconnected unexpectedly.');
      setStatus('error');
      throw new Error('Device disconnected');
    }

    const payload = btoa(`${ssid},${password}`);
    logger.info('Writing Wi-Fi credentials to device via BLE');

    await connected.writeCharacteristicWithResponseForService(
      BLE_SERVICE_UUID,
      BLE_CHARACTERISTIC_UUID,
      payload,
    );

    logger.info('Wi-Fi credentials written successfully');
  }, []);

  const reset = useCallback(() => {
    bleManager.stopDeviceScan();
    deviceRef.current?.cancelConnection();
    deviceRef.current = null;
    setConnectedDevice(null);
    setDevices([]);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
      deviceRef.current?.cancelConnection();
    };
  }, []);

  return { 
    status, 
    devices, 
    connectedDevice, 
    errorMessage,
    startScan, 
    connectToDevice, 
    writeCredentials,
    reset 
  };
}
