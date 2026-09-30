import React from 'react';
import { View, Text } from 'react-native';

interface PasswordRequirementsProps {
  unmetRequirements: string[];
}

export function PasswordRequirements({ unmetRequirements }: PasswordRequirementsProps) {
  if (!unmetRequirements || unmetRequirements.length === 0) return null;

  return (
    <View className="mt-2 w-full">
      {unmetRequirements.map((req, index) => (
        <View key={index} className="flex-row items-center gap-2 mt-1">
          <View className="w-1.5 h-1.5 rounded-full bg-destructive" />
          <Text className="text-[12px] font-medium text-destructive">{req}</Text>
        </View>
      ))}
    </View>
  );
}
