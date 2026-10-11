import { BleManager, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// Singleton BLE manager shared across the app lifetime
export const bleManager = new BleManager();

// UUIDs for the SAGANA AIVSP ESP32 firmware
export const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const BLE_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  return Object.values(granted).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
}

// Waits for BleManager to fully initialize before reading state
// bleManager.state() is unreliable on startup and can return PoweredOff when Bluetooth is on
export function waitForBluetoothReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const subscription = bleManager.onStateChange((state) => {
      subscription.remove();
      resolve(state === State.PoweredOn);
    }, true); // emitCurrentValue=true fires immediately with real state
  });
}
