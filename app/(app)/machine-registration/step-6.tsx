import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';

export default function MachineRegistrationStep6() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Replace the entire registration stack so back navigation returns to machines list
    router.replace('/(app)/(tabs)/machines');
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-4 items-center justify-between pb-10">
        <View className="w-full max-w-[380px] pt-12">
          {/* Success illustration area */}
          <View className="w-full h-[182px] bg-skeleton rounded-2xl mb-8 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
              <Check size={28} color="#FAF9EE" strokeWidth={2.5} />
            </View>
          </View>

          {/* Title & description */}
          <View className="w-full gap-2.5">
            <Text className="text-[20px] font-bold text-foreground text-left">
              Your machine has been registered!
            </Text>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              You can now start to see and learn about your newly registered device.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View className="w-full max-w-[380px]">
          <Pressable
            onPress={handleFinish}
            className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90"
            accessibilityRole="button"
          >
            <Text className="text-[14px] font-bold text-primary-foreground">Finish</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
