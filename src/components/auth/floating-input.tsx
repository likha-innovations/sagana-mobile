import React, { useState, useEffect, type RefObject } from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Eye, EyeOff, CircleAlert } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export interface FloatingInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  hasError?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: RefObject<TextInput | null>;
}

export function FloatingInputField({
  label,
  value,
  onChangeText,
  isPassword = false,
  hasError = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: FloatingInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const floatProgress = useSharedValue(hasValue ? 1 : 0);

  useEffect(() => {
    floatProgress.value = withTiming(isFloating ? 1 : 0, {
      duration: 170,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isFloating, floatProgress]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatProgress.value, [0, 1], [0, -10]);
    const scale = interpolate(floatProgress.value, [0, 1], [1, 0.78]);

    return {
      transform: [{ translateY }, { scale }],
      transformOrigin: 'left center',
    };
  });

  return (
    <Pressable
      onPress={() => inputRef?.current?.focus()}
      className={cn(
        'w-full h-[58px] rounded-2xl border-[1.5px] px-5 flex-row items-center justify-between bg-background transition-colors',
        hasError
          ? 'border-destructive bg-destructive/[0.03]'
          : isFocused
            ? 'border-foreground/50'
            : 'border-input'
      )}
    >
      <View className="flex-1 justify-center h-full relative">
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 19,
            },
            animatedLabelStyle,
          ]}
        >
          <Text
            className={cn(
              'text-[14px] font-sans select-none',
              hasError
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            )}
          >
            {label}
          </Text>
        </Animated.View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            paddingTop: isFloating ? 14 : 0,
          }}
          className="text-[14px] font-sans text-foreground p-0 m-0 w-full h-full"
        />
      </View>

      {/* Trailing Icons */}
      <View className="flex-row items-center gap-1 -mr-1">
        {isPassword && hasValue && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} color={hasError ? '#E84C4C' : '#414141'} />
            ) : (
              <Eye size={18} color={hasError ? '#E84C4C' : '#414141'} />
            )}
          </Pressable>
        )}
        
        {hasError && (
          <View className="p-1 pointer-events-none">
            <CircleAlert size={18} color="#E84C4C" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
