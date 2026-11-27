import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { hasSeenOnboarding } from '@/lib/onboarding-storage';

export default function SplashScreen() {
  const router = useRouter();

  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.98, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    let isMounted = true;
    const timer = setTimeout(async () => {
      if (!isMounted) return;
      try {
        const seen = await hasSeenOnboarding();
        if (!isMounted) return;

        if (!seen) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(auth)/sign-in');
        }
      } catch {
        try {
          const seen = await hasSeenOnboarding();
          if (!isMounted) return;
          if (!seen) {
            router.replace('/(auth)/onboarding');
          } else {
            router.replace('/(auth)/sign-in');
          }
        } catch {
          if (!isMounted) return;
          router.replace('/(auth)/onboarding');
        }
      }
    }, 2200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={['#404D0A', '#CEFF00']}
      start={{ x: 0.16, y: 0.0 }}
      end={{ x: 0.84, y: 1.0 }}
      style={{ flex: 1 }}
      className="items-center justify-center"
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: 76,
            height: 79,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Image
          source={require('@/assets/sagana_logo_cream.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      </Animated.View>
    </LinearGradient>
  );
}
