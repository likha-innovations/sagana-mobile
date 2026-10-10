import { View, Text, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Info, AlertCircle, Bluetooth, BluetoothOff, Wifi, Cpu } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        Once powered on, your SAGANA AIVSP Machine should blink 3 times in order to proceed.
      </Text>
      <View className="w-full h-[220px] bg-skeleton rounded-2xl mt-8" />
    </View>
  );
}

// Render individual device card
function DeviceCard({ device, isConnecting, onConnect }: { device: Device, isConnecting: boolean, onConnect: () => void }) {
  return (
    <Pressable 
      onPress={onConnect}
      disabled={isConnecting}
      className="flex-row items-center p-4 mb-3 bg-card border border-border rounded-2xl active:bg-neutral-100"
    >
      <View className="w-12 h-12 rounded-full bg-brand-50 items-center justify-center mr-4">
        <Cpu size={24} color="#718619" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">
          {device.name || 'Unknown Device'}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5 font-mono">
          {device.id}
        </Text>
      </View>
      {isConnecting && (
        <ActivityIndicator size="small" color="#718619" />
      )}
    </Pressable>
  );
}

// Status label and icon mapping for each BLE phase
function ScanStatusIndicator({ 
  status, 
  devices,
  connectedDevice,
  errorMessage,
  onConnect,
  onRetry 
}: {
  status: BleStatus;
  devices: Device[];
  connectedDevice: Device | null;
  errorMessage: string | null;
  onConnect: (d: Device) => void;
  onRetry: () => void;
}) {
  if (status === 'connected' && connectedDevice) {
    return (
      <View className="items-center gap-4 mt-8">
        <View className="w-20 h-20 rounded-full bg-brand-100 items-center justify-center">
          <Bluetooth size={36} color="#718619" />
        </View>
        <Text className="text-base font-semibold text-foreground">Connected successfully!</Text>
        <Text className="text-sm text-muted-foreground text-center">
          Paired with {connectedDevice.name || connectedDevice.id}. Press Next to continue.
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="items-center gap-4 mt-8">
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center">
          <BluetoothOff size={36} color="#E84C4C" />
        </View>
        <Text className="text-base font-semibold text-foreground">Connection Failed</Text>
        <Text className="text-sm text-destructive text-center">{errorMessage}</Text>
        <Button title="Try Again" onPress={onRetry} variant="outline" haptic />
      </View>
    );
  }

  return (
    <View className="mt-8 flex-1">
      <View className="flex-row items-center gap-3 mb-6">
        <ActivityIndicator size="small" color="#718619" />
        <Text className="text-sm font-medium text-muted-foreground">
          {status === 'scanning' ? 'Scanning for nearby machines...' : 'Connecting...'}
        </Text>
      </View>

      {devices.length === 0 && status === 'scanning' ? (
        <View className="items-center justify-center py-8">
          <Text className="text-sm text-muted-foreground text-center">
            No machines found yet. Ensure it is turned on and close to your phone.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {devices.map((d) => (
            <DeviceCard 
              key={d.id} 
              device={d} 
              isConnecting={status === 'connecting'} 
              onConnect={() => onConnect(d)} 
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function ConnectStep({ 
  status, 
  devices,
  connectedDevice,
  errorMessage,
  onConnect,
  onRetry 
}: {
  status: BleStatus;
  devices: Device[];
  connectedDevice: Device | null;
  errorMessage: string | null;
  onConnect: (d: Device) => void;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Connect to your machine</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Select your AIVSP Machine from the list below to pair with it securely.
      </Text>
      <ScanStatusIndicator 
        status={status} 
        devices={devices} 
        connectedDevice={connectedDevice}
        errorMessage={errorMessage}
        onConnect={onConnect}
        onRetry={onRetry} 
      />
    </View>
  );
}

export function WifiCredentialsStep({ 
  control, 
  setValue 
}: { 
  control: Control<MachineRegistrationInput>;
  setValue: UseFormSetValue<MachineRegistrationInput>;
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
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <Wifi size={20} color="#718619" />
          <Text className="text-2xl font-bold text-foreground">Wi-Fi credentials</Text>
        </View>
      </View>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed mb-6">
        To connect your AIVSP Machine to your network, you must enter your Wi-Fi credentials.
      </Text>

      <View className="mb-4 flex-row justify-end">
        <Button 
          title="Use Current Wi-Fi SSID" 
          variant="outline" 
          size="sm" 
          onPress={handleAutoFill}
          loading={isFetching}
          haptic 
        />
      </View>

      <Controller
        control={control}
        name="ssid"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            placeholder="SSID"
            value={value}
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
            placeholder="Wi-Fi Password"
            isPassword
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            trailingIcon={error ? <AlertCircle size={18} color="#E84C4C" /> : undefined}
          />
        )}
      />

      <View className="flex-row mt-2">
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
            placeholder="Machine Name"
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
    <View className="flex-1 justify-center mt-12">
      <View className="w-full h-[220px] bg-skeleton rounded-2xl mb-8" />
      <Text className="text-2xl font-bold text-foreground">Your machine has been registered!</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
        You can now start a compost batch using your newly registered device.
      </Text>
    </View>
  );
}
