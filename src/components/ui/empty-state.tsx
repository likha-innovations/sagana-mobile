import type { ReactNode } from "react";
import { View, Text, Image } from "react-native";
import { cn } from "@/lib/utils";

export function EmptyState({
  message,
  action,
  className = "",
}: {
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("items-center justify-center gap-4 py-4 self-center", className)}>
      <Image
        source={require("../../../assets/icons/mascot/sagana-mascot-sleeping.png")}
        style={{ width: 108, height: 108 }}
        resizeMode="contain"
        accessibilityLabel="Sagana sleeping mascot"
      />
      <Text className="text-center font-sans text-sm text-[#AFAEA7]">
        {message}
      </Text>
      {action ? (
        <View className="items-center justify-center">
          {action}
        </View>
      ) : null}
    </View>
  );
}
