import { ActivityIndicator, Image, Text, View } from "react-native";
import { colors } from "@/constants";

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Connecting to Sagana"
        accessibilityState={{ busy: true }}
        className="w-full max-w-[320px] items-center gap-3 rounded-[14px] bg-brand-50 px-6 py-8"
      >
        <Image
          source={require("../../../assets/sagana_logo.png")}
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="contain"
          style={{ width: 76, height: 76 }}
        />
        <Text className="text-lg font-bold text-foreground text-center">
          Connecting to Sagana
        </Text>
        <Text className="text-sm font-sans text-foreground text-center">
          This may take a moment.
        </Text>
        <ActivityIndicator color={colors.brand[700]} />
      </View>
    </View>
  );
}
