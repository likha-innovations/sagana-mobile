import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthContext } from '@/context/auth-context';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuthContext();

  const handleFinish = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // As per Figma "Go to Log In" implies the user must re-authenticate with the new password
    await signOut();
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 px-4 pb-16 justify-center">
        
        <View className="flex-1 justify-center items-center gap-8 w-full mt-10">
          {/* Image Placeholder */}
          <View className="w-full h-[182px] bg-[#D9D9D9] rounded-[12px]" />
          
          <View className="gap-2.5 items-center px-4 w-full text-center">
            <Text className="text-[20px] font-bold text-foreground text-center">
              You are all set!
            </Text>
            <Text className="text-[14px] text-foreground font-sans text-center">
              You can now login to your account using your new password.
            </Text>
          </View>
        </View>

        {/* Go to Log In Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleFinish}
          className="w-full h-[45px] bg-primary rounded-[50px] items-center justify-center mt-auto"
        >
          <Text className="text-[14px] font-bold text-primary-foreground">
            Go to Log In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
