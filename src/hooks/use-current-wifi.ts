import { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import * as burnt from 'burnt';

export function useCurrentWifi() {
  const [ssid, setSsid] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchWifi = useCallback(async () => {
    setIsFetching(true);
    try {
      // Android requires Location Services to be physically ON to read Wi-Fi SSID
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        burnt.toast({
          title: 'Enable Location Services',
          message: 'Android requires Location to be ON to read your Wi-Fi name.',
          preset: 'error',
        });
        setIsFetching(false);
        return null;
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          burnt.toast({ title: 'Location permission required to read Wi-Fi', preset: 'error' });
          setIsFetching(false);
          return null;
        }
      }

      const state = await NetInfo.fetch();

      if (state.type === 'wifi' && state.details && 'ssid' in state.details) {
        const networkSsid = state.details.ssid;
        if (networkSsid && networkSsid !== '<unknown ssid>') {
          setSsid(networkSsid);
          setIsFetching(false);
          burnt.toast({ title: 'Wi-Fi SSID retrieved!', preset: 'done' });
          return networkSsid;
        } else {
          burnt.toast({ title: 'Could not read SSID. Ensure Location is enabled.', preset: 'error' });
        }
      } else {
        burnt.toast({ title: 'Not connected to a Wi-Fi network.', preset: 'error' });
      }

      setIsFetching(false);
      return null;
    } catch {
      burnt.toast({ title: 'Failed to read network information', preset: 'error' });
      setIsFetching(false);
      return null;
    }
  }, []);

  return { ssid, isFetching, fetchWifi };
}
