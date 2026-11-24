import { View, Text, Pressable, Image, ScrollView } from 'react-native';
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
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 40,
        }}
        className="px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-95 pt-8 items-center">
          <View className="w-45 h-45 items-center justify-center mb-4">
            <Image
              source={require('@/assets/icons/mascot/sagana_confused.png')}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
              accessibilityLabel="Confused mascot illustration"
            />
          </View>
          <Text className="text-28 font-bold text-foreground text-center mb-4">
            Uh-oh, we're sorry!
          </Text>
          <Text className="text-sm font-sans text-foreground text-center leading-6">
            If you've lost access to your registered email address, you will need to contact your organization's admin to regain access or reset your account manually.
          </Text>
        </View>

        <View className="w-full max-w-95">
          <Pressable
            onPress={handleGoBack}
            className="w-full h-11.25 rounded-full bg-primary items-center justify-center active:opacity-90"
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
