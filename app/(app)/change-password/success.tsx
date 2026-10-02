import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/context/auth-context';

export default function ChangePasswordSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleGoToLogin = async () => {
    setLoading(true);
    try {
      // Force sign out so they have to log in with new password
      await signOut();
    } catch (err) {
      // If signOut fails, just redirect
      router.replace('/(auth)/sign-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-4 items-center justify-between pb-10">
        <View className="w-full max-w-[380px] pt-12">
          <View className="w-full h-[182px] bg-[#E2E1DC] rounded-[12px] mb-8 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-2xl font-bold">✓</Text>
            </View>
          </View>

          <View className="w-full gap-2.5">
            <Text className="text-[20px] font-bold text-foreground text-left">
              You are all set!
            </Text>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              You can now login to your account using your new password.
            </Text>
          </View>
        </View>

        <View className="w-full max-w-[380px]">
          <Pressable
            onPress={handleGoToLogin}
            disabled={loading}
            className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FAF9EE" size="small" />
            ) : (
              <Text className="text-[14px] font-bold text-primary-foreground">
                Go to Log In
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
