import React, { useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import { cn } from '@/lib/utils';

interface OtpInputGroupProps {
  code: string;
  onChangeCode: (code: string) => void;
  hasError?: boolean;
}

export function OtpInputGroup({ code, onChangeCode, hasError = false }: OtpInputGroupProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleCharChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const codeArr = code.padEnd(6, ' ').split('');

    if (cleaned.length > 0) {
      codeArr[index] = cleaned[cleaned.length - 1];
      const newCode = codeArr.join('').trimEnd();
      onChangeCode(newCode);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const codeArr = code.padEnd(6, ' ').split('');
      if (codeArr[index] && codeArr[index] !== ' ') {
        codeArr[index] = ' ';
        onChangeCode(codeArr.join('').trimEnd());
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const prevArr = code.padEnd(6, ' ').split('');
        prevArr[index - 1] = ' ';
        onChangeCode(prevArr.join('').trimEnd());
      }
    }
  };

  return (
    <View className="w-full flex-row justify-between items-center max-w-[380px]">
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const digit = code[index] || '';
        const isFocused = focusedIndex === index;
        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleCharChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            className={cn(
              'w-[52px] h-[61px] rounded-[14px] border-[1.5px] bg-background text-[24px] font-bold text-foreground',
              hasError
                ? 'border-destructive text-destructive'
                : isFocused || digit
                  ? 'border-foreground/50'
                  : 'border-input'
            )}
          />
        );
      })}
    </View>
  );
}
