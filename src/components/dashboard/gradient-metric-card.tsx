import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants';

export interface GradientMetricCardProps {
  value: string | number;
  unit: string;
  label: string;
  icon: ReactNode;
}

export function GradientMetricCard({ value, unit, label, icon }: GradientMetricCardProps) {
  return (
    <LinearGradient
      colors={[colors.gradient.statCard.colors[0], colors.gradient.statCard.colors[1]]}
      locations={[colors.gradient.statCard.locations[0], colors.gradient.statCard.locations[1]]}
      start={colors.gradient.statCard.start}
      end={colors.gradient.statCard.end}
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
