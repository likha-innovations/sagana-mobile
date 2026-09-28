import { useState, forwardRef, type ReactNode } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
  leadingIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      isPassword = false,
      leadingIcon,
      containerClassName,
      secureTextEntry,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isSecure = isPassword ? !showPassword : secureTextEntry;

    return (
      <View className={cn('w-full mb-3.5', containerClassName)}>
        {label && (
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            {label}
          </Text>
        )}
        <View
          className={cn(
            'w-full h-12 flex-row items-center rounded-2xl border px-3.5 transition-all',
            error
              ? 'border-destructive bg-destructive/5'
              : isFocused
                ? 'border-primary bg-background ring-2 ring-primary/15'
                : 'border-input bg-background'
          )}
        >
          {leadingIcon && <View className="mr-2.5">{leadingIcon}</View>}

          <TextInput
            ref={ref}
            placeholderTextColor="#96958F"
            secureTextEntry={isSecure}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'flex-1 h-full text-sm font-medium text-foreground',
              className
            )}
            {...props}
          />

          {isPassword && (
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              className="p-1.5 -mr-1"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} color="#64748b" />
              ) : (
                <Eye size={18} color="#64748b" />
              )}
            </Pressable>
          )}
        </View>

        {error ? (
          <Text className="text-xs font-medium text-red-500 mt-1">{error}</Text>
        ) : hint ? (
          <Text className="text-xs text-slate-500 mt-1">{hint}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';
