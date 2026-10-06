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
  trailingIcon?: ReactNode;
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
      trailingIcon,
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
        <View
          className={cn(
            'w-full min-h-[58px] flex-row items-center rounded-2xl border px-4 transition-all py-2',
            error
              ? 'border-destructive bg-destructive/5'
              : isFocused
                ? 'border-primary bg-background ring-2 ring-primary/15'
                : 'border-input bg-card'
          )}
        >
          {leadingIcon && <View className="mr-2.5">{leadingIcon}</View>}
          
          <View className="flex-1 justify-center">
            {label && (
              <Text className="text-xs text-muted-foreground font-sans">
                {label}
              </Text>
            )}
            <TextInput
              ref={ref}
              placeholderTextColor="#AFAEA7"
              secureTextEntry={isSecure}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                'text-sm font-medium text-foreground p-0 mt-0.5',
                className
              )}
              {...props}
            />
          </View>



          {isPassword && (
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              className="p-1.5 -mr-1"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} color="#414141" />
              ) : (
                <Eye size={18} color="#414141" />
              )}
            </Pressable>
          )}

          {trailingIcon && !isPassword && <View className="ml-2.5">{trailingIcon}</View>}
        </View>

        {error ? (
          <Text className="text-xs font-medium text-destructive mt-1">{error}</Text>
        ) : hint ? (
          <Text className="text-xs font-sans text-muted-foreground mt-1">{hint}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';
