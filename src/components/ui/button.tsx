import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  Platform,
  type PressableProps,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'w-full flex-row items-center justify-center rounded-xl transition-all active:opacity-85 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-700/20',
        secondary: 'bg-slate-100 active:bg-slate-200',
        outline: 'border border-slate-200 bg-white active:bg-slate-50',
        ghost: 'bg-transparent active:bg-slate-100',
        destructive: 'bg-red-600 active:bg-red-700 shadow-sm shadow-red-600/20',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-10 px-3.5',
        lg: 'h-14 px-6',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('font-bold text-center', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-slate-800',
      outline: 'text-slate-800',
      ghost: 'text-slate-800',
      destructive: 'text-white',
    },
    size: {
      default: 'text-sm font-semibold',
      sm: 'text-xs font-semibold',
      lg: 'text-base font-bold',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  title?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      children,
      title,
      variant,
      size,
      loading = false,
      disabled = false,
      className,
      textClassName,
      onPress,
      ...props
    },
    ref
  ) => {
    const handlePress = (e: any) => {
      if (loading || disabled) return;
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? '#15803d' : '#ffffff'}
          />
        ) : typeof children === 'string' || title ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {title ?? children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
