import { View, Text, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { Info, AlertCircle, Bluetooth } from 'lucide-react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Controller, type Control, UseFormSetValue } from 'react-hook-form';
import type { Device } from 'react-native-ble-plx';
import type { MachineRegistrationInput } from '@/types/device';
import type { BleStatus } from '@/hooks/use-bluetooth';
import { useCurrentWifi } from '@/hooks';

export function TurnOnStep() {
  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Turn on your machine</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Once powered on, your{' '}
        <Text className="font-bold text-foreground">SAGANA AIVSP Machine</Text>
        {' '}should blink 3 times in order to proceed.
      </Text>
      <View className="w-full h-[220px] bg-skeleton rounded-2xl mt-8" />
    </View>
  );
}

// Skeleton placeholder rows shown while BLE is scanning with no results yet
function DeviceSkeletons() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className="flex-row items-center px-4 py-4 bg-card border border-border rounded-2xl"
        >
          <Skeleton className="w-5 h-5 rounded-full mr-4" />
          <Skeleton className="h-4 flex-1 rounded" />
        </View>
      ))}
    </View>
  );
}

// Single BLE device row
function DeviceCard({
  device,
  isConnecting,
  hasError,
  onConnect,
}: {
  device: Device;
  isConnecting: boolean;
  hasError: boolean;
  onConnect: () => void;
}) {
  return (
    <Pressable
      onPress={onConnect}
      disabled={isConnecting}
      className="flex-row items-center px-4 py-4 mb-3 bg-card border border-border rounded-2xl active:bg-neutral-100"
    >
      <View className="mr-4">
        <Bluetooth size={20} color={hasError ? '#E84C4C' : '#718619'} />
      </View>
      <Text className="flex-1 text-base font-semibold text-foreground">
        {device.name || 'Unknown Device'}
      </Text>
      {isConnecting && (
        <Text className="text-sm text-muted-foreground">Connecting...</Text>
      )}
      {hasError && !isConnecting && (
        <Text className="text-sm text-destructive">Error, try again!</Text>
      )}
    </Pressable>
  );
}

export function ConnectStep({
  status,
  devices,
  connectedDevice,
  connectingDeviceId,
  errorMessage,
  onConnect,
  onRetry,
}: {
  status: BleStatus;
  devices: Device[];
  connectedDevice: Device | null;
  connectingDeviceId?: string | null;
  errorMessage: string | null;
  onConnect: (d: Device) => void;
  onRetry: () => void;
}) {
  // BT off or permission denied — no device list available
  const isBtError = status === 'error' && devices.length === 0;
  // Connection attempt failed but BT is still on — list remains
  const isConnectError = status === 'error' && devices.length > 0;
  const isScanning = status === 'scanning' || status === 'connecting' || status === 'requesting-permission';

  const handleEnableBluetooth = async () => {
    try {
      if (Platform.OS === 'android') {
        // startActivityAsync awaits the dialog close, so retry immediately after
        await IntentLauncher.startActivityAsync('android.bluetooth.adapter.action.REQUEST_ENABLE');
        onRetry();
      } else {
        await Linking.openURL('App-Prefs:root=Bluetooth');
        // iOS Settings does not return on close, user taps Refresh manually
      }
    } catch {
      // dialog dismissed or settings unavailable
    }
  };

  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Connect to your machine</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Turn on your Bluetooth and pair it with the machine.
      </Text>

      {isBtError && (
        <View className="mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <AlertCircle size={16} color="#E84C4C" />
            <Text className="text-sm text-destructive flex-1">
              {errorMessage ?? 'Cannot proceed because Bluetooth is turned off.'}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={handleEnableBluetooth}>
              <Text className="text-sm font-bold text-primary">Turn on my Bluetooth</Text>
            </Pressable>
            <Pressable onPress={onRetry}>
              <Text className="text-sm font-bold text-primary">Refresh</Text>
            </Pressable>
          </View>
        </View>
      )}

      {(isScanning || isConnectError || status === 'connected') && (
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-4">
            {isScanning ? (
              <Text className="text-sm text-muted-foreground">
                {status === 'connecting' ? 'Connecting...' : 'Finding devices..'}
              </Text>
            ) : (
              <View />
            )}
            <Pressable onPress={onRetry}>
              <Text className="text-sm font-bold text-primary">Refresh</Text>
            </Pressable>
          </View>

          {status === 'connected' && connectedDevice ? (
            <View>
              <Pressable className="flex-row items-center px-4 py-4 mb-3 bg-card border border-primary rounded-2xl">
                <View className="mr-4">
                  <Bluetooth size={20} color="#718619" />
                </View>
                <Text className="flex-1 text-base font-semibold text-foreground">
                  {connectedDevice.name || 'Unknown Device'}
                </Text>
                <Text className="text-sm font-bold text-primary">Connected!</Text>
              </Pressable>
              {devices
                .filter((d) => d.id !== connectedDevice.id)
                .map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={d}
                    isConnecting={false}
                    hasError={false}
                    onConnect={() => onConnect(d)}
                  />
                ))}
            </View>
          ) : isScanning && devices.length === 0 ? (
            // Skeleton rows while scan has not yet returned any devices
            <DeviceSkeletons />
          ) : (
            devices.map((d) => (
              <DeviceCard
                key={d.id}
                device={d}
                isConnecting={status === 'connecting' && connectingDeviceId === d.id}
                // Mark the card whose connection attempt failed
                hasError={isConnectError && connectingDeviceId === d.id}
                onConnect={() => onConnect(d)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export function WifiCredentialsStep({
  control,
  setValue,
  isConnecting = false,
  errorMessage = null,
}: {
  control: Control<MachineRegistrationInput>;
  setValue: UseFormSetValue<MachineRegistrationInput>;
  isConnecting?: boolean;
  errorMessage?: string | null;
}) {
  const { fetchWifi, isFetching } = useCurrentWifi();

  const handleAutoFill = async () => {
    const currentSsid = await fetchWifi();
    if (currentSsid) {
      setValue('ssid', currentSsid, { shouldValidate: true });
    }
  };

  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Enter your Wi-Fi credentials</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed mb-6">
        To connect your AIVSP Machine to your network, you must enter your Wi-Fi credentials.
      </Text>

      {isConnecting && (
        <View className="p-4 mb-4 bg-brand-50 border border-brand-200 rounded-2xl flex-row items-center gap-3">
          <ActivityIndicator size="small" color="#718619" />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              Connecting device to WiFi...
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Testing Wi-Fi connection with your machine. This may take 10-20 seconds.
            </Text>
          </View>
        </View>
      )}

      {errorMessage && !isConnecting && (
        <View className="p-4 mb-4 bg-red-50 border border-destructive/20 rounded-2xl flex-row items-center gap-3">
          <AlertCircle size={20} color="#E84C4C" style={{ flexShrink: 0 }} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-destructive">Connection Failed</Text>
            <Text className="text-xs text-destructive mt-0.5 leading-relaxed">
              {errorMessage}
            </Text>
          </View>
        </View>
      )}

      <Controller
        control={control}
        name="ssid"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            placeholder="SSID"
            value={value}
            editable={!isConnecting}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            trailingIcon={error ? <AlertCircle size={18} color="#E84C4C" /> : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            placeholder="Wi-Fi password"
            isPassword
            value={value}
            editable={!isConnecting}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            trailingIcon={error ? <AlertCircle size={18} color="#E84C4C" /> : undefined}
          />
        )}
      />

      <Pressable
        onPress={handleAutoFill}
        disabled={isConnecting || isFetching}
        className="mt-1 mb-4 self-start active:opacity-70 disabled:opacity-40"
      >
        <Text className="text-sm font-bold text-primary">Use my current Wi-Fi name</Text>
      </Pressable>

      <View className="flex-row">
        <Info size={16} color="#AFAEA7" style={{ marginTop: 2, marginRight: 8, flexShrink: 0 }} />
        <Text className="text-xs text-muted-foreground flex-1 leading-relaxed">
          If you ever change your Wi-Fi credentials, you must reconnect this machine through the app.
        </Text>
      </View>
    </View>
  );
}

export function NameMachineStep({ control }: { control: Control<MachineRegistrationInput> }) {
  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Name your machine</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed mb-8">
        Give a name to your new SAGANA AIVSP Machine.
      </Text>

      <Controller
        control={control}
        name="machineName"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            placeholder="Machine name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            trailingIcon={error ? <AlertCircle size={18} color="#E84C4C" /> : undefined}
          />
        )}
      />
    </View>
  );
}

export function SuccessStep() {
  return (
    <View className="flex-1 mt-4">
      <View className="w-full h-[220px] bg-skeleton rounded-2xl mb-8" />
      <Text className="text-2xl font-bold text-foreground">Your machine has been registered!</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
        You can now start a compost batch using your newly registered device.
      </Text>
    </View>
  );
}
