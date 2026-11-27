import { useState } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
  Platform,
} from 'react-native';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { useDynamicLayout } from '@/hooks';
import { cn } from '@/lib/utils';

export interface SuccessScreenProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonPress: () => void;
  loading?: boolean;
  alignText?: 'center' | 'left';
  mascotWidth?: number;
  mascotHeight?: number;
  lottieSource?: string | AnimationObject | { uri: string };
  fallbackImageSource?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function SuccessScreen({
  title,
  description,
  buttonText,
  onButtonPress,
  loading = false,
  alignText = 'center',
  mascotWidth = 264,
  mascotHeight = 264,
  lottieSource = require('@/assets/icons/mascot/onboarding/sagana_celebration.lottie'),
  fallbackImageSource = require('@/assets/icons/mascot/sagana_welcome.png'),
  style,
  className,
  testID = 'success-screen',
}: SuccessScreenProps) {
  const { insets } = useDynamicLayout();
  const { width } = useWindowDimensions();
  const [lottieError, setLottieError] = useState(false);

  const maxMascotWidth = Math.max(120, width - 32);
  const scale = mascotWidth > maxMascotWidth ? maxMascotWidth / mascotWidth : 1;
  const renderedWidth = Math.round(mascotWidth * scale);
  const renderedHeight = Math.round(mascotHeight * scale);

  const handlePress = () => {
    if (loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onButtonPress();
  };

  return (
    <View
      testID={testID}
      className={cn('flex-1 bg-background', className)}
      style={[
        {
          paddingTop: Math.max(insets.top, 48),
          paddingBottom: Math.max(insets.bottom + 16, 48),
        },
        style,
      ]}
    >
      <View className="flex-1 px-4 items-center justify-between pb-4">
        <View className="flex-1 w-full items-center justify-center">
          <View
            style={{ width: renderedWidth, height: renderedHeight }}
            className="items-center justify-center"
          >
            {!lottieError && lottieSource ? (
              <LottieView
                source={lottieSource}
                autoPlay
                loop
                cacheComposition
                renderMode="HARDWARE"
                hardwareAccelerationAndroid
                style={{ width: renderedWidth, height: renderedHeight }}
                onAnimationFailure={() => setLottieError(true)}
              />
            ) : (
              <Image
                source={fallbackImageSource}
                style={{ width: renderedWidth, height: renderedHeight }}
                resizeMode="contain"
                accessibilityLabel="Sagana Mascot"
              />
            )}
          </View>
        </View>

        <View className="w-full max-w-95 gap-8">
          <View
            className={cn(
              'w-full gap-2.5',
              alignText === 'center' ? 'items-center px-2' : 'items-start',
            )}
          >
            <Text
              testID={`${testID}-title`}
              className={cn(
                'text-xl font-bold text-foreground',
                alignText === 'center' ? 'text-center' : 'text-left',
              )}
            >
              {title}
            </Text>
            <Text
              testID={`${testID}-description`}
              className={cn(
                'text-sm font-sans text-foreground leading-5',
                alignText === 'center' ? 'text-center' : 'text-left',
              )}
            >
              {description}
            </Text>
          </View>

          <Pressable
            testID={`${testID}-button`}
            onPress={handlePress}
            disabled={loading}
            className="w-full min-h-11 py-3 rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FAF9EE" size="small" />
            ) : (
              <Text className="text-sm font-bold text-primary-foreground">{buttonText}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
