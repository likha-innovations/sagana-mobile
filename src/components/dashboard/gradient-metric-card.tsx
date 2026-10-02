import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface GradientMetricCardProps {
  value: string | number;
  unit: string;
  label: string;
  icon: ReactNode;
}

export function GradientMetricCard({ value, unit, label, icon }: GradientMetricCardProps) {
  return (
    <LinearGradient
      colors={['#C9E752', '#518251']}
      locations={[0.33, 1]}
      start={{ x: 0.85, y: 0 }}
      end={{ x: 0.1, y: 1 }}
      style={{ borderRadius: 14 }}
      className="w-[217px] h-[121px] p-4 justify-between"
    >
      <View className="self-start">
        {icon}
      </View>
      <View className="gap-0.5">
        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-[28px] font-bold text-[#FAF9EE]">{value}</Text>
          <Text className="text-[16px] font-bold text-[#FAF9EE]">{unit}</Text>
        </View>
        <Text className="text-[12px] text-[#FAF9EE] font-sans">{label}</Text>
      </View>
    </LinearGradient>
  );
}
