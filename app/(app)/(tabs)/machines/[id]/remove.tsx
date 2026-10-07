import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { useRemoveMachine } from '@/hooks/use-machines';
import { useDynamicLayout } from '@/hooks';

export default function RemoveMachineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { insets } = useDynamicLayout();
  
  const { mutate: removeMachine, isPending } = useRemoveMachine();

  const handleRemove = () => {
    removeMachine(id, {
      onSuccess: () => {
        // Go back to devices tab (pop 2 screens: this one and the menu)
        router.dismissAll();
        router.push('/(app)/(tabs)/machines' as any);
      },
    });
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-neutral-100">
          <ChevronLeft size={24} color="#414141" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground ml-2">
          Remove Machine
        </Text>
      </View>

      <View className="flex-1 px-4 pt-8 items-center">
        <View className="bg-red-50 p-4 rounded-full mb-6">
          <AlertTriangle size={48} color="#E84C4C" />
        </View>
        
        <Text className="text-2xl font-bold text-foreground mb-4 text-center">
          Are you absolutely sure?
        </Text>
        
        <Text className="text-base text-muted-foreground font-medium text-center mb-8 px-4">
          This action cannot be undone. This will permanently disconnect the machine from your account and remove its data from our servers.
        </Text>

        <View className="w-full gap-4 mt-auto mb-4">
          <Pressable
            onPress={handleRemove}
            disabled={isPending}
            className="bg-destructive rounded-full p-4 items-center justify-center flex-row"
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-primary-foreground">
                Yes, remove machine
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            disabled={isPending}
            className="bg-secondary rounded-full p-4 items-center justify-center"
          >
            <Text className="text-base font-bold text-foreground">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
