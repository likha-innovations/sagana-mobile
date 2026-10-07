import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Trees, Box } from 'lucide-react-native';
import { useAuthContext } from '@/context/auth-context';
import { useProfile, useBarangays, useDynamicLayout } from '@/hooks';
import { useMachines } from '@/hooks/use-machines';
import { useDashboardMetrics } from '@/hooks/use-batches';
import type { DashboardMetrics } from '@/types/batch';
import { CompostIcon, BroccoliIcon } from '@/components/icons';
import { GradientMetricCard, QuickActionButton } from '@/components/dashboard';
import { MachineCard } from '@/components/devices/machine-card';
import { getBarangayName } from '@/lib/utils';

const defaultMetrics: DashboardMetrics = {
  totalCompost: { value: 0, unit: 'kg' },
  totalGreens: { value: 0, unit: 'kg' },
  totalBrowns: { value: 0, unit: 'kg' },
};

export default function DashboardScreen() {
  const { insets, scrollPaddingBottom } = useDynamicLayout();
  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const { data: profileData } = useProfile();
  const { data: barangays = [] } = useBarangays();
  const { data: realMachines, isLoading: machinesLoading } = useMachines();
  const { data: dynamicMetrics } = useDashboardMetrics();
  
  const user = profileData || authUser;
  const firstName = user?.fullName?.split(' ')[0] || 'Operator';
  const metrics = dynamicMetrics ?? defaultMetrics;
  const barangayName = getBarangayName(user, barangays);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 48),
          paddingBottom: scrollPaddingBottom,
        }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="px-4 gap-8">
          
          {/* Header */}
          <View className="gap-2">
            <Text className="text-[20px] font-bold text-foreground">
              Hello, {firstName}!
            </Text>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={16} color="#414141" />
              <Text className="text-[14px] text-foreground font-sans">
                {barangayName}
              </Text>
            </View>
          </View>

          {/* Metric Cards (Horizontal Scroll) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            className="-mx-4"
          >
            <GradientMetricCard
              value={metrics.totalCompost.value}
              unit={metrics.totalCompost.unit}
              label="Total Compost Produced"
              icon={<CompostIcon size={24} color="#FAF9EE" />}
            />
            <GradientMetricCard
              value={metrics.totalGreens.value}
              unit={metrics.totalGreens.unit}
              label="Total Greens Converted"
              icon={<BroccoliIcon size={24} color="#FAF9EE" />}
            />
            <GradientMetricCard
              value={metrics.totalBrowns.value}
              unit={metrics.totalBrowns.unit}
              label="Total Browns Converted"
              icon={<Trees size={24} color="#FAF9EE" />}
            />
          </ScrollView>

          {/* Quick Actions */}
          <View className="gap-4">
            <Text className="text-[16px] font-bold text-foreground">
              Quick Actions
            </Text>
            <View className="gap-3">
              <QuickActionButton
                label="Start new compost batch"
                icon={<CompostIcon size={20} color="#FAF9EE" />}
                onPress={() => {
                  router.push('/(app)/batch/new' as any);
                }}
              />
              <QuickActionButton
                label="Add new SAGANA Machine"
                icon={<Box size={20} color="#FAF9EE" />}
                onPress={() => {
                  // Phase 4: Navigate to machine provisioning
                }}
              />
            </View>
          </View>

          {/* Your Machines */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] font-bold text-foreground">
                Your Machines
              </Text>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/machines' as any)}>
                <Text className="text-[12px] font-bold text-primary">View All</Text>
              </TouchableOpacity>
            </View>

            {/* Dashboard Cards mapped from real data */}
            {machinesLoading ? (
              <Text className="text-sm text-muted-foreground">Loading machines...</Text>
            ) : realMachines && realMachines.length > 0 ? (
              realMachines.map((machine) => (
                <MachineCard 
                  key={machine.machine_id} 
                  machine={machine} 
                  onPress={() => router.push(`/(app)/(tabs)/machines/${machine.machine_id}` as any)} 
                />
              ))
            ) : (
              <Text className="text-sm text-muted-foreground">No machines found.</Text>
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
