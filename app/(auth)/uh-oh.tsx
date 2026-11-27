import { useState } from 'react';
import { View, Pressable, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Text } from '@/components/ui/text';

export default function UhOhScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [lottieError, setLottieError] = useState(false);

  const handleGoBack = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: Math.max(insets.top, 48), paddingBottom: Math.max(insets.bottom + 16, 48) }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 16,
        }}
        className="px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-95 pt-6 items-start">
          <View className="w-50 h-50 self-center items-center justify-center mb-8">
            {!lottieError ? (
              <LottieView
                source={require('@/assets/icons/mascot/onboarding/sagana_sad.lottie')}
                autoPlay
                loop
                cacheComposition
                renderMode="HARDWARE"
                hardwareAccelerationAndroid
                style={{ width: 200, height: 200 }}
                onAnimationFailure={() => setLottieError(true)}
              />
            ) : (
              <Image
                source={require('@/assets/icons/mascot/sagana_confused.png')}
                style={{ width: 180, height: 180 }}
                resizeMode="contain"
                accessibilityLabel="Sad mascot illustration"
              />
            )}
          </View>
          <Text className="text-xl font-bold text-foreground text-left mb-2.5">
            Uh-oh, we're sorry!
          </Text>
          <Text className="text-sm font-sans text-foreground text-left leading-5">
            If you've lost access to your registered email address, you will need to contact your organization's admin to regain access or reset your account manually.
          </Text>
        </View>

        <View className="w-full max-w-95 pt-6">
          <Pressable
            onPress={handleGoBack}
            className="w-full min-h-11 py-3 rounded-full bg-primary items-center justify-center active:opacity-90"
            accessibilityRole="button"
          >
            <Text className="text-sm font-bold text-primary-foreground">
              Got it, go back to log in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
