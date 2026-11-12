import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

export default function SuspendedScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuthContext();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await queryClient.refetchQueries({ queryKey: ['signup-profile', user?.id] });
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        className="px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Top/Middle Section with Centered Logo and Message */}
        <View className="w-full max-w-[380px] items-center pt-16">
          {/* Centered Logo in Middle */}
          <View className="w-full items-center justify-center mb-10 mt-6">
            <Image
              source={require('@/assets/sagana-wordmark-side.png')}
              style={{ width: 280, height: 160 }}
              resizeMode="contain"
              accessibilityLabel="SAGANA Logo"
            />
          </View>

          {/* Centered Message */}
          <View className="w-full items-center">
            <Text className="text-[24px] font-bold text-foreground text-center">
              Account Suspended
            </Text>
            <Text className="text-[14px] font-sans text-muted-foreground text-center mt-3 leading-6 max-w-[320px]">
              Your operator access has been suspended by your Barangay Administrator. Please reach out to your barangay office to restore access.
            </Text>
          </View>
        </View>

        {/* Action Controls Section */}
        <View className="w-full max-w-[380px] pb-10 gap-3">
          {/* Primary Action Button: Check Status / Refresh */}
          <Pressable
            onPress={handleCheckStatus}
            disabled={checking}
            className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Check Account Status"
          >
            {checking ? (
              <ActivityIndicator color="#FAF9EE" size="small" />
            ) : (
              <Text className="text-[15px] font-bold text-primary-foreground">
                Check Status
              </Text>
            )}
          </Pressable>

          {/* Secondary Outline Button: Sign Out */}
          <Pressable
            onPress={handleSignOut}
            className="w-full h-[50px] rounded-full border-[1.5px] border-primary bg-transparent items-center justify-center active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
          >
            <Text className="text-[15px] font-bold text-primary">
              Sign out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

