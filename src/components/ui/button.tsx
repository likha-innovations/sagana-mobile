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
  'w-full flex-row items-center justify-center rounded-full transition-all active:opacity-85 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90 shadow-sm shadow-primary/20',
        secondary: 'bg-secondary active:opacity-90',
        outline: 'border border-border bg-background active:bg-muted',
        destructive: 'bg-destructive active:opacity-90 shadow-sm shadow-destructive/20',
        ghost: 'bg-transparent active:bg-muted',
        link: 'bg-transparent underline-offset-4',
      },
      size: {
        default: 'h-12 px-5 py-3',
        sm: 'h-10 px-3.5',
        lg: 'h-14 px-8',
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
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      destructive: 'text-destructive-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
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
  haptic?: boolean;
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
      haptic = false,
      className,
      textClassName,
      onPress,
      ...props
    },
    ref
  ) => {
    const handlePress = (e: any) => {
      if (loading || disabled) return;
      if (haptic && Platform.OS !== 'web') {
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
