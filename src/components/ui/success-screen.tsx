import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
  Platform,
} from 'react-native';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useDynamicLayout } from '@/hooks';
import { cn } from '@/lib/utils';

export interface SuccessScreenProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonPress: () => void;
  loading?: boolean;
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
  lottieSource = require('@/assets/icons/mascot/onboarding/sagana_celebration.lottie'),
  fallbackImageSource = require('@/assets/icons/mascot/sagana_celebrate.png'),
  style,
  className,
  testID = 'success-screen',
}: SuccessScreenProps) {
  const { insets } = useDynamicLayout();
  const [lottieError, setLottieError] = useState(false);

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
          paddingBottom: Math.max(insets.bottom, 32),
        },
        style,
      ]}
    >
      <View className="flex-1 px-4 items-center justify-between pb-6">
        {/* Figma Standard Graphic Box: 264px x 264px centered */}
        <View className="flex-1 items-center justify-center">
          <View className="w-[264px] h-[264px] items-center justify-center">
            {!lottieError && lottieSource ? (
              <LottieView
                source={lottieSource}
                autoPlay
                loop
                cacheComposition
                renderMode="HARDWARE"
                hardwareAccelerationAndroid
                style={{ width: 264, height: 264 }}
                onAnimationFailure={() => setLottieError(true)}
              />
            ) : (
              <Image
                source={fallbackImageSource}
                style={{ width: 264, height: 264 }}
                resizeMode="contain"
                accessibilityLabel="Sagana Mascot"
              />
            )}
          </View>
        </View>

        {/* Figma Standard Bottom Action Container: 188px fixed layout */}
        <View className="w-full max-w-[380px] min-h-[188px] justify-between pb-2">
          {/* Typography block with 10px gap */}
          <View className="gap-2.5">
            <Text
              testID={`${testID}-title`}
              className="text-[20px] font-bold text-foreground text-left"
            >
              {title}
            </Text>
            <Text
              testID={`${testID}-description`}
              className="text-[14px] font-sans text-foreground text-left leading-5"
            >
              {description}
            </Text>
          </View>

          {/* Primary CTA button (45px pill) */}
          <Pressable
            testID={`${testID}-button`}
            onPress={handlePress}
            disabled={loading}
            className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FAF9EE" size="small" />
            ) : (
              <Text className="text-[14px] font-bold text-primary-foreground">
                {buttonText}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
