import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from 'lucide-react-native';
import { useMachines } from '@/hooks/use-machines';
import { MachineCard } from '@/components/devices/machine-card';
import { QuickActionButton } from '@/components/dashboard';

export default function MachinesListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: machines, refetch, isRefetching, isLoading } = useMachines();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <Text className="text-[20px] font-bold text-foreground mb-4">
          Machines
        </Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="small" color="#718619" />
          </View>
        ) : (!machines || machines.length === 0) ? (
          <View className="mt-2">
            <QuickActionButton
              label="Add new SAGANA Machine"
              icon={<Box size={20} color="#FAF9EE" />}
              onPress={() => {
                // Future: Navigate to add machine flow
              }}
            />
          </View>
        ) : (
          machines.map((machine) => (
            <MachineCard
              key={machine.machine_id}
              machine={machine}
              onPress={() => router.push(`/(app)/(tabs)/machines/${machine.machine_id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
