import { forwardRef, type ReactNode, type ElementRef } from 'react';
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
        destructive: 'bg-rose-600 active:bg-rose-700 shadow-sm shadow-rose-600/20',
        ghost: 'bg-transparent active:bg-slate-100',
        link: 'bg-transparent underline-offset-4',
      },
      size: {
        default: 'h-12 px-5 py-3',
        sm: 'h-10 rounded-lg px-3.5',
        lg: 'h-14 rounded-2xl px-8',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const buttonTextVariants = cva('font-semibold text-center select-none', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-slate-800',
      outline: 'text-slate-700',
      destructive: 'text-white',
      ghost: 'text-slate-700',
      link: 'text-emerald-700 underline',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
      icon: 'text-base',
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
  children?: ReactNode;
  title?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = forwardRef<ElementRef<typeof Pressable>, ButtonProps>(
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
