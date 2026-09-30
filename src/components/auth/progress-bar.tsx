import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  activeStep: number;
  totalSteps: number;
}

export function ProgressBar({ activeStep, totalSteps }: ProgressBarProps) {
  return (
    <View className="flex-row items-center gap-[6px] w-[144px] h-[6px]">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isCompleted = stepNumber < activeStep;
        
        return (
          <View
            key={index}
            className={cn(
              'h-full rounded-[14px]',
              isActive ? 'flex-[4]' : 'flex-[1]',
              isActive || isCompleted ? 'bg-primary' : 'bg-[#C8C7BE]'
            )}
          />
        );
      })}
    </View>
  );
}
