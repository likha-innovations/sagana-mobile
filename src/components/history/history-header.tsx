import type { ReactNode } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { ChevronLeft } from "lucide-react-native";
import { useRouter, type Href } from "expo-router";
import { useDynamicLayout } from "@/hooks/use-layout";
import { colors } from "@/constants";

export function HistoryHeader({
  title,
  back = true,
  action,
  onBack,
  fallbackHref,
}: {
  title: string;
  back?: boolean;
  action?: ReactNode;
  onBack?: () => void;
  fallbackHref?: Href;
}) {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const stack = width < 360 || fontScale > 1.2;
  const { headerPaddingTop } = useDynamicLayout();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref ?? "/(app)/(tabs)/history");
    }
  };

  return (
    <View
      style={{ paddingTop: Math.max(headerPaddingTop, 48) }}
      className="mb-8 flex-row flex-wrap items-center justify-between gap-x-2 px-4"
    >
      <View
        className={
          stack
            ? "w-full flex-row items-center"
            : "flex-1 flex-row items-center"
        }
      >
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            className="min-h-12 min-w-12 items-start justify-center"
          >
            <ChevronLeft size={24} color={colors.semantic.foreground} />
          </Pressable>
        )}
        <Text
          accessibilityRole="header"
          className={
            back
              ? "flex-1 text-base font-bold text-foreground"
              : "flex-1 text-3xl font-bold text-foreground"
          }
        >
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}
