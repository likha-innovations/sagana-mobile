import { View, Text } from 'react-native';
import { Info, AlertCircle } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Controller, type Control } from 'react-hook-form';
import type { MachineRegistrationInput } from '@/types/device';

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

export function ConnectStep() {
  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Connect to your machine</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Connect to the Wi-Fi network of your AIVSP Machine to connect to it.
      </Text>
      <View className="w-full h-[220px] bg-skeleton rounded-2xl mt-8" />
    </View>
  );
}

export function WifiCredentialsStep({ control }: { control: Control<MachineRegistrationInput> }) {
  return (
    <View className="flex-1 mt-4">
      <Text className="text-2xl font-bold text-foreground">Enter your Wi-Fi credentials</Text>
      <Text className="text-sm text-muted-foreground mt-2 leading-relaxed mb-8">
        To connect your AIVSP Machine to your network, you must enter your Wi-Fi credentials.
      </Text>

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
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            trailingIcon={error ? <AlertCircle size={18} color="#E84C4C" /> : undefined}
          />
        )}
      />

      <View className="flex-row mt-2">
        <Info size={16} color="#AFAEA7" className="mt-0.5 mr-2 flex-shrink-0" />
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
