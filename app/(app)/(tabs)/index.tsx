import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Trees, Box } from 'lucide-react-native';
import { mockDashboardData } from '@/lib/mock-data';
import { useAuthContext } from '@/context/auth-context';
import { useProfile, useBarangays } from '@/hooks';
import { useMachines } from '@/hooks/use-machines';
import { CompostIcon, BroccoliIcon } from '@/components/icons';
import { GradientMetricCard, QuickActionButton } from '@/components/dashboard';
import { MachineCard } from '@/components/devices/machine-card';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const { data: profileData } = useProfile();
  const { data: barangays = [] } = useBarangays();
  const { data: realMachines, isLoading: machinesLoading } = useMachines();
  
  const user = profileData || authUser;
  const firstName = user?.fullName?.split(' ')[0] || 'Operator';
  const { metrics, machines } = mockDashboardData;
  
  let barangayName = 'Unknown Location';
  if (user?.barangay) {
    if (typeof user.barangay === 'object' && user.barangay.name) {
      barangayName = user.barangay.name;
    } else if (typeof user.barangay === 'string') {
      const bId = user.barangay;
      barangayName = barangays.find(b => b.id === bId || b.name === bId)?.name || bId;
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 48),
          paddingBottom: insets.bottom + 100, // Account for floating tab bar
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
                  // Phase 4: Navigate to new compost batch flow
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
