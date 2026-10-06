import type { ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants';

export interface QuickActionButtonProps {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
}

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  const handlePress = () => {
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
      <LinearGradient
        colors={[colors.gradient.actionButton.colors[0], colors.gradient.actionButton.colors[1]]}
        locations={[colors.gradient.actionButton.locations[0], colors.gradient.actionButton.locations[1]]}
        start={colors.gradient.actionButton.start}
        end={colors.gradient.actionButton.end}
        style={{
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6.3,
          elevation: 4,
        }}
        className="h-[60px] flex-row items-center px-4 gap-4"
      >
        {icon}
        <Text className="text-[14px] text-[#FAF9EE] font-sans flex-1">
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
