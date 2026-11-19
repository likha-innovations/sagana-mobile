import { useNetInfo } from '@react-native-community/netinfo';

export function useNetwork() {
  const netInfo = useNetInfo();

  return {
    isOffline: netInfo.isConnected === false || netInfo.isInternetReachable === false,
    isConnected: netInfo.isConnected ?? true,
    isInternetReachable: netInfo.isInternetReachable ?? true,
    type: netInfo.type,
    details: netInfo.details,
  };
}
