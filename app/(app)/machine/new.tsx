import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useDynamicLayout } from '@/hooks';

export default function AddMachineScreen() {
  const router = useRouter();
  const { insets } = useDynamicLayout();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full">
          <ChevronLeft size={24} color="#414141" />
        </Pressable>
        <Text className="text-base font-bold text-foreground ml-2">
          Add Machine
        </Text>
      </View>

      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-muted-foreground font-medium">
          // TODO: Implement Add Machine Flow
        </Text>
        <Text className="text-center text-xs text-muted-foreground mt-2">
          This is a placeholder route for the next developer to build the machine pairing or registration form.
        </Text>
      </View>
    </View>
  );
}
