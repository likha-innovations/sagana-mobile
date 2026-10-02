import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function UhOhScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleGoBack = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-4 items-center justify-between pb-10">
        <View className="w-full max-w-[380px] pt-12">
          <Text className="text-[32px] font-bold text-foreground text-center mb-6">
            Uh-oh, we're sorry!
          </Text>
          <Text className="text-[14px] font-sans text-foreground text-center leading-6">
            If you've lost access to your registered email address, you will need to contact your organization's admin to regain access or reset your account manually.
          </Text>
        </View>

        <View className="w-full max-w-[380px]">
          <Pressable
            onPress={handleGoBack}
            className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90"
            accessibilityRole="button"
          >
            <Text className="text-[14px] font-bold text-primary-foreground">
              Got it, go back to log in
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
