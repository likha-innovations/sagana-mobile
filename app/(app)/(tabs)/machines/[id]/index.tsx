import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { ChevronLeft, Wifi, WifiOff, Settings, Clock, Thermometer, Droplets, Wind, Cloud, Fan, FlaskConical, ShowerHead } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMachine, useFeedstocks } from '@/hooks/use-machines';
import { useDynamicLayout } from '@/hooks';
import { SensorStatCard } from '@/components/devices/sensor-stat-card';

export default function MachineDetailsDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { insets, scrollPaddingBottom } = useDynamicLayout();
  const { data: machine, isLoading } = useMachine(id);
  const { data: feedstocks } = useFeedstocks(id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="small" color="#718619" />
      </View>
    );
  }

  if (!machine) return null;

  const isOffline = machine.status === 'offline';
  const isVacant = machine.status === 'maintenance'; // We mapped maintenance to Vacant in mock data

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full">
            <ChevronLeft size={24} color="#414141" />
          </Pressable>
          <Text className="text-base font-bold text-foreground ml-2">
            {machine.name}
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          {isOffline ? (
            <WifiOff size={20} color="#E84C4C" strokeWidth={1.5} />
          ) : (
            <Wifi size={20} color="#718619" strokeWidth={1.5} />
          )}
          <Pressable>
            <Settings size={20} color="#414141" strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: scrollPaddingBottom }}>
        
        {/* Overview Section */}
        <Text className="text-sm font-bold text-foreground mb-3">Overview</Text>
        
        {isVacant ? (
          <View className="bg-card rounded-2xl border border-border p-6 mb-6">
            <Text className="text-xs font-medium text-foreground text-center mb-1">Your machine is</Text>
            <Text className="text-2xl font-bold text-foreground text-center mb-6">Vacant</Text>
            
            <Pressable className="w-full" disabled={isOffline}>
              {isOffline ? (
                <View className="bg-secondary rounded-lg px-4 py-4 w-full flex-row items-center justify-center gap-2 opacity-50">
                  <FlaskConical size={18} color="#414141" strokeWidth={1.5} />
                  <Text className="text-sm font-bold text-foreground">Start new compost batch</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#C9E752', '#518251']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-lg px-4 py-4 w-full flex-row items-center justify-center gap-2"
                >
                  <FlaskConical size={18} color="#FFFFFF" strokeWidth={1.5} />
                  <Text className="text-sm font-bold text-primary-foreground">Start new compost batch</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        ) : (
          /* COMPOSTING STATE */
          <>
            <View className="bg-card rounded-2xl border border-border p-6 pt-8 mb-6">
              <Text className="text-sm font-medium text-brand-500 text-center mb-1">Your machine is</Text>
              <Text className="text-[28px] font-bold text-brand-700 text-center mb-10">Composting</Text>
              
              {(() => {
                const temp = machine.latest_readings?.temperature ?? 0;
                let currentPhase: 'mesophilic' | 'thermophilic' | 'cooling' = 'mesophilic';
                
                if (temp >= 45) {
                  currentPhase = 'thermophilic';
                } else if (temp > 0 && temp < 45 && Math.floor((Date.now() - new Date(machine.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 21) {
                  currentPhase = 'cooling';
                }

                const phaseIndex = ['mesophilic', 'thermophilic', 'cooling'].indexOf(currentPhase);
                
                return (
                  <View className="relative mb-6">
                    {/* Connecting Lines (Absolute positioned behind) */}
                    <View className="absolute top-[10px] left-[16.66%] right-[16.66%] h-1.5 bg-[#E2E1DC] rounded-full" />
                    {phaseIndex > 0 && (
                      <View 
                        className="absolute top-[10px] left-[16.66%] h-1.5 bg-brand-500 rounded-full" 
                        style={{ right: phaseIndex === 2 ? '16.66%' : '50%' }} 
                      />
                    )}

                    {/* Step Containers */}
                    <View className="flex-row items-center justify-between">
                      {/* Step 0 */}
                      <View className="items-center flex-1">
                        <View className="w-6 h-6 rounded-full bg-brand-500 z-10" />
                        <Text className={`mt-3 text-[11px] ${phaseIndex === 0 ? 'font-bold text-brand-500' : 'font-medium text-[#AFAEA7]'}`}>Mesophilic</Text>
                      </View>
                      
                      {/* Step 1 */}
                      <View className="items-center flex-1">
                        <View className={`w-6 h-6 rounded-full z-10 ${phaseIndex >= 1 ? 'bg-brand-500' : 'bg-[#E2E1DC]'}`} />
                        <Text className={`mt-3 text-[11px] ${phaseIndex === 1 ? 'font-bold text-brand-500' : 'font-medium text-[#AFAEA7]'}`}>Thermophilic</Text>
                      </View>
                      
                      {/* Step 2 */}
                      <View className="items-center flex-1">
                        <View className={`w-6 h-6 rounded-full z-10 ${phaseIndex >= 2 ? 'bg-brand-500' : 'bg-[#E2E1DC]'}`} />
                        <Text className={`mt-3 text-[11px] ${phaseIndex === 2 ? 'font-bold text-brand-500' : 'font-medium text-[#AFAEA7]'}`}>Cooling</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
              
              <View className="flex-row items-center justify-center gap-1.5 mt-2">
                <Clock size={14} color="#AFAEA7" />
                <Text className="text-[13px] font-medium text-muted-foreground">2m ago</Text>
              </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between gap-4 mb-8">
              <View className="flex-1 bg-card rounded-2xl border border-border py-6 items-center justify-center">
                <Text className="text-2xl font-bold text-foreground mb-1">
                  {Math.max(0, Math.floor((Date.now() - new Date(machine.created_at).getTime()) / (1000 * 60 * 60 * 24)))}
                </Text>
                <Text className="text-xs font-medium text-muted-foreground">Days Composting</Text>
              </View>
              <View className="flex-1 bg-card rounded-2xl border border-border py-6 items-center justify-center">
                <Text className="text-2xl font-bold text-foreground mb-1">
                  {feedstocks?.reduce((sum, item) => sum + item.weight_kg, 0).toFixed(1) ?? '0.0'} kg
                </Text>
                <Text className="text-xs font-medium text-muted-foreground">Total Feedstock</Text>
              </View>
            </View>

            {/* Feedstocks */}
            <Text className="text-sm font-bold text-foreground mb-3">Feedstocks</Text>
            <View className="flex-row flex-wrap justify-between gap-y-6 mb-8 px-2">
              {feedstocks?.map((item) => (
                <View key={item.id} className="w-[30%] items-center">
                  <View className="w-16 h-16 bg-neutral-200 rounded-lg mb-2" />
                  <Text className="text-[10px] font-medium text-foreground text-center leading-3">{item.name}</Text>
                  <Text className="text-[10px] font-medium text-muted-foreground">{item.weight_kg} kg</Text>
                </View>
              ))}
            </View>

            {/* Live Sensor Readings */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-foreground">Live Sensor Readings</Text>
              <Link href={`/(app)/(tabs)/machines/${machine.machine_id}/sensors-history` as any} asChild>
                <Pressable>
                  <Text className="text-xs font-bold text-brand-500">View history</Text>
                </Pressable>
              </Link>
            </View>
            
            <View className="flex-row flex-wrap justify-between gap-y-4 mb-4">
              <SensorStatCard icon={Thermometer} iconColor="#AB6DD5" value={`${machine.latest_readings?.temperature ?? '--'}°C`} label="Temperature" />
              <SensorStatCard icon={Droplets} iconColor="#51A7B1" value={`${machine.latest_readings?.moisture ?? '--'}%`} label="Moisture" />
              <SensorStatCard icon={Wind} iconColor="#DBCC41" value={`${machine.latest_readings?.oxygen ?? '--'}%`} label="Oxygen" />
              <SensorStatCard icon={Cloud} iconColor="#6CAD6C" value={`${machine.latest_readings?.co2 ?? '--'}%`} label="Carbon Dioxide" />
            </View>
            <View className="flex-row items-center justify-center gap-1 mb-8">
              <Clock size={12} color="#AFAEA7" />
              <Text className="text-xs font-medium text-muted-foreground">
                {machine.latest_readings?.updated_at ? 'Updated recently' : 'No data'}
              </Text>
            </View>

            {/* Automations */}
            <View className="flex-row items-center justify-between mb-3 mt-2">
              <Text className="text-sm font-bold text-foreground">Automations</Text>
              <Link href={`/(app)/(tabs)/machines/${machine.machine_id}/automation-logs` as any} asChild>
                <Pressable>
                  <Text className="text-xs font-bold text-brand-500">View logs</Text>
                </Pressable>
              </Link>
            </View>

            <View className="bg-card rounded-2xl border border-border p-4 mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Fan size={24} color="#718619" strokeWidth={2} className="ml-1" />
                <View className="ml-1">
                  <Text className="text-[15px] font-bold text-foreground mb-0.5">Aeration</Text>
                  <Text className="text-[12px] font-medium text-brand-500">On</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[11px] font-medium text-brand-500 mb-0.5">On until</Text>
                <View className="flex-row items-center gap-1.5">
                  <Clock size={16} color="#718619" strokeWidth={2.5} />
                  <Text className="text-[18px] font-bold text-brand-700">6:07</Text>
                </View>
              </View>
            </View>

            <View className="bg-card rounded-2xl border border-border p-4 mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <ShowerHead size={24} color="#AFAEA7" strokeWidth={2} className="ml-1" />
                <View className="ml-1">
                  <Text className="text-[15px] font-bold text-foreground mb-0.5">Sprinkler</Text>
                  <Text className="text-[12px] font-medium text-muted-foreground">Off</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[11px] font-medium text-muted-foreground mb-0.5">Off until</Text>
                <View className="flex-row items-center gap-1.5">
                  <Droplets size={16} color="#414141" strokeWidth={2.5} />
                  <Text className="text-[18px] font-bold text-foreground">45%</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
