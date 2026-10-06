import React, { useState, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

interface ResendTimerProps {
  onResend: () => void;
  cooldownSeconds?: number;
}

export function ResendTimer({ onResend, cooldownSeconds = 60 }: ResendTimerProps) {
  const [cooldown, setCooldown] = useState(cooldownSeconds);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handlePress = () => {
    if (cooldown === 0) {
      setCooldown(cooldownSeconds);
      onResend();
    }
  };

  const formattedTime = `0:${cooldown.toString().padStart(2, '0')}`;

  return (
    <View className="w-full items-start mt-2">
      <Pressable
        onPress={handlePress}
        disabled={cooldown > 0}
        className="py-1"
      >
        <Text className="text-[14px] font-medium text-foreground">
          <Text className="text-muted-foreground font-sans">Didn't receive any code? </Text>
          <Text
            className={cn(
              'font-semibold',
              cooldown > 0 ? 'text-gray-progress' : 'text-primary'
            )}
          >
            {cooldown > 0 ? `Resend in ${formattedTime}` : 'Resend'}
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}
