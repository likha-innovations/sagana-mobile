import type { ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
        colors={['#C9E752', '#518251', '#518251']}
        locations={[0, 0.47, 1]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.1, y: 1 }}
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
