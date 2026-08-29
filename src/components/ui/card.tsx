import { forwardRef, type ReactNode, type ElementRef } from 'react';
import { View, Text, type ViewProps, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface CardProps extends ViewProps {
  children?: ReactNode;
  className?: string;
}

export const Card = forwardRef<ElementRef<typeof View>, CardProps>(
  ({ children, className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/5',
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<ElementRef<typeof View>, CardProps>(
  ({ children, className, ...props }, ref) => (
    <View ref={ref} className={cn('flex-col space-y-1.5 pb-3', className)} {...props}>
      {children}
    </View>
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends TextProps {
  children?: ReactNode;
  className?: string;
}

export const CardTitle = forwardRef<ElementRef<typeof Text>, CardTitleProps>(
  ({ children, className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-lg font-semibold tracking-tight text-card-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  )
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends TextProps {
  children?: ReactNode;
  className?: string;
}

export const CardDescription = forwardRef<ElementRef<typeof Text>, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<ElementRef<typeof View>, CardProps>(
  ({ children, className, ...props }, ref) => (
    <View ref={ref} className={cn('pt-1', className)} {...props}>
      {children}
    </View>
  )
);
CardContent.displayName = 'CardContent';
