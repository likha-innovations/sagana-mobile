import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Camera, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';
import { parseWifiQr, type WifiQrCredentials } from '@/lib/wifi-qr';

const logger = createLogger('WifiQrScanner');

interface WifiQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (credentials: WifiQrCredentials) => void;
}

export function WifiQrScannerModal({
  visible,
  onClose,
  onScanned,
}: WifiQrScannerModalProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanError, setScanError] = useState<string | null>(null);
  const scanLockedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      scanLockedRef.current = false;
      setScanError(null);
      return;
    }

    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLockedRef.current) return;

    const raw = result.data ?? '';
    const parsed = parseWifiQr(raw);
    if (!parsed) {
      scanLockedRef.current = true;
      logger.warn(`Unrecognized QR payload (len=${raw.length}): ${raw.slice(0, 60)}`);
      const preview = raw.replace(/\s+/g, ' ').trim().slice(0, 36);
      setScanError(
        `Not a valid Wi-Fi QR code${preview ? ` (${preview}${raw.length > 36 ? '...' : ''})` : ''}.`,
      );
      return;
    }

    scanLockedRef.current = true;
    setScanError(null);
    onScanned(parsed);
    onClose();
  };

  const handleRetryScan = () => {
    scanLockedRef.current = false;
    setScanError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4">
          <View className="flex-1 pr-3">
            <Text className="text-xl font-bold text-foreground">Scan Wi-Fi QR</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Point your camera at a Wi-Fi QR code to fill SSID and password.
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close QR scanner"
            className="w-11 h-11 rounded-full bg-card border border-border items-center justify-center active:opacity-70"
          >
            <X size={20} color="#262626" />
          </Pressable>
        </View>

        {!permission?.granted ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-16 h-16 rounded-2xl bg-card border border-border items-center justify-center mb-4">
              <Camera size={28} color="#718619" />
            </View>
            <Text className="text-lg font-bold text-foreground text-center">
              Camera permission needed
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-2 mb-6 leading-relaxed">
              Allow camera access to scan a Wi-Fi QR code from your router or another phone.
            </Text>
            {permission?.canAskAgain ? (
              <Button title="Allow Camera" onPress={() => void requestPermission()} haptic />
            ) : (
              <Button title="Open Settings" onPress={() => void Linking.openSettings()} haptic />
            )}
          </View>
        ) : (
          <View className="flex-1 px-6">
            <View className="flex-1 rounded-3xl overflow-hidden border border-border bg-black">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View
                pointerEvents="none"
                className="absolute inset-0 items-center justify-center"
              >
                <View className="w-60 h-60 rounded-3xl border-2 border-white/80" />
              </View>
            </View>

            {scanError && (
              <View className="mt-4 p-4 rounded-2xl bg-red-50 border border-destructive/20 flex-row items-center gap-3">
                <AlertCircle size={18} color="#E84C4C" style={{ flexShrink: 0 }} />
                <Text className="text-xs text-destructive flex-1 leading-relaxed">
                  {scanError}
                </Text>
                <Pressable onPress={handleRetryScan} className="px-2 py-1 active:opacity-70">
                  <Text className="text-xs font-bold text-primary">Retry</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
