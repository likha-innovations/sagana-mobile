import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Leaf,
  Trees,
  Sprout,
  Plus,
  Box,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { mockDashboardData, getPhaseStep } from '@/lib/mock-data';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { metrics, machines } = mockDashboardData;

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
            <Text className="text-[20px] font-bold text-foreground font-bold">
              Hello, Neo Isaiah!
            </Text>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={16} color="#414141" />
              <Text className="text-[14px] text-foreground font-sans">
                Barangay 176-E
              </Text>
            </View>
          </View>

          {/* Metric Cards (Horizontal Scroll) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            className="-mx-4 px-4"
          >
            {/* Card 1: Compost */}
            <LinearGradient
              colors={['#518251', '#C9E752']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14 }}
              className="w-[217px] h-[121px] p-4 justify-between"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-[28px] font-bold text-white">{metrics.totalCompost.value}</Text>
                  <Text className="text-[16px] font-bold text-white">{metrics.totalCompost.unit}</Text>
                </View>
                <Leaf size={24} color="#ffffff" />
              </View>
              <Text className="text-[12px] text-white font-sans">Total Compost Produced</Text>
            </LinearGradient>

            {/* Card 2: Greens */}
            <LinearGradient
              colors={['#518251', '#C9E752']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14 }}
              className="w-[217px] h-[121px] p-4 justify-between"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-[28px] font-bold text-white">{metrics.totalGreens.value}</Text>
                  <Text className="text-[16px] font-bold text-white">{metrics.totalGreens.unit}</Text>
                </View>
                <Sprout size={24} color="#ffffff" />
              </View>
              <Text className="text-[12px] text-white font-sans">Total Greens Converted</Text>
            </LinearGradient>

            {/* Card 3: Browns */}
            <LinearGradient
              colors={['#518251', '#C9E752']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14 }}
              className="w-[217px] h-[121px] p-4 justify-between"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-[28px] font-bold text-white">{metrics.totalBrowns.value}</Text>
                  <Text className="text-[16px] font-bold text-white">{metrics.totalBrowns.unit}</Text>
                </View>
                <Trees size={24} color="#ffffff" />
              </View>
              <Text className="text-[12px] text-white font-sans">Total Browns Converted</Text>
            </LinearGradient>
          </ScrollView>

          {/* Quick Actions */}
          <View className="gap-4">
            <Text className="text-[16px] font-bold text-foreground">
              Quick Actions
            </Text>
            <View className="gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <LinearGradient
                  colors={['#518251', '#C9E752']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 8 }}
                  className="h-[60px] flex-row items-center px-4 gap-4 shadow-sm"
                >
                  <Plus size={20} color="#ffffff" />
                  <Text className="text-[14px] font-bold text-white">Start new compost batch</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <LinearGradient
                  colors={['#518251', '#C9E752']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 8 }}
                  className="h-[60px] flex-row items-center px-4 gap-4 shadow-sm"
                >
                  <Box size={20} color="#ffffff" />
                  <Text className="text-[14px] font-bold text-white">Add new SAGANA Machine</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Your Machines */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] font-bold text-foreground">
                Your Machines
              </Text>
              <TouchableOpacity onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Text className="text-[12px] font-bold text-primary">View All</Text>
              </TouchableOpacity>
            </View>

            {/* Dashboard Cards mapped from mock data */}
            {machines.map((machine) => {
              const step = getPhaseStep(machine.phase);

              return (
                <View key={machine.id} className="rounded-[14px] border border-[#DCDBD5] bg-card p-4 gap-6">
                  
                  {/* Header Info */}
                  <View className="flex-row items-center justify-between">
                    <View className="gap-1">
                      <Text className="text-[14px] font-bold text-foreground">{machine.name}</Text>
                      <Text className="text-[12px] text-muted-foreground font-sans">Day {machine.day}</Text>
                    </View>
                    <Text className="text-[12px] text-muted-foreground font-sans">{machine.phase}</Text>
                  </View>

                  {/* Progress Bar */}
                  <View className="flex-row h-[6px] gap-2.5">
                    <View className={`flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-[#C8C7BE]'}`} />
                    <View className={`flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-[#C8C7BE]'}`} />
                    <View className={`flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-[#C8C7BE]'}`} />
                  </View>

                  {/* Sensor Grid (Row) */}
                  <View className="flex-row justify-between gap-2">
                    <View className="flex-1 h-[99px] border border-[#DCDBD5] rounded-[8px] items-center justify-center gap-2.5 bg-card">
                      <Thermometer size={24} color={machine.sensors.temperature.color} />
                      <View className="items-center">
                        <Text style={{ color: machine.sensors.temperature.color }} className="text-[14px] font-bold">
                          {machine.sensors.temperature.value}{machine.sensors.temperature.unit}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground font-sans">Temp.</Text>
                      </View>
                    </View>

                    <View className="flex-1 h-[99px] border border-[#DCDBD5] rounded-[8px] items-center justify-center gap-2.5 bg-card">
                      <Droplets size={24} color={machine.sensors.moisture.color} />
                      <View className="items-center">
                        <Text style={{ color: machine.sensors.moisture.color }} className="text-[14px] font-bold">
                          {machine.sensors.moisture.value}{machine.sensors.moisture.unit}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground font-sans">Moisture</Text>
                      </View>
                    </View>

                    <View className="flex-1 h-[99px] border border-[#DCDBD5] rounded-[8px] items-center justify-center gap-2.5 bg-card">
                      <Wind size={24} color={machine.sensors.oxygen.color} />
                      <View className="items-center">
                        <Text style={{ color: machine.sensors.oxygen.color }} className="text-[14px] font-bold">
                          {machine.sensors.oxygen.value}{machine.sensors.oxygen.unit}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground font-sans">O2</Text>
                      </View>
                    </View>

                    <View className="flex-1 h-[99px] border border-[#DCDBD5] rounded-[8px] items-center justify-center gap-2.5 bg-card">
                      <Cloud size={24} color={machine.sensors.carbonDioxide.color} />
                      <View className="items-center">
                        <Text style={{ color: machine.sensors.carbonDioxide.color }} className="text-[14px] font-bold">
                          {machine.sensors.carbonDioxide.value}{machine.sensors.carbonDioxide.unit}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground font-sans">CO2</Text>
                      </View>
                    </View>
                  </View>

                </View>
              );
            })}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
