import {
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Sprout } from "lucide-react-native";
import type { BatchFeedstock } from "@/types/batch";
import { getFeedstockImage } from "@/constants/feedstocks";
import { colors } from "@/constants";

export function FeedstockGrid({
  feedstocks,
}: {
  feedstocks: BatchFeedstock[];
}) {
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.6 ? 1 : width < 360 || fontScale > 1.2 ? 2 : 3;
  return (
    <View className="flex-row flex-wrap gap-y-8">
      {feedstocks.map((item) => {
        const imageSource = getFeedstockImage(item.name);
        return (
          <View
            key={item.id}
            style={{ width: `${100 / columns}%` }}
            className="items-center gap-2 px-2 py-5"
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={{ width: 74, height: 60 }}
                contentFit="contain"
                accessible={false}
              />
            ) : (
              <View
                style={{ width: 74, height: 60 }}
                className="items-center justify-center rounded-xl bg-muted/40"
              >
                <Sprout size={28} color={colors.brand[500]} />
              </View>
            )}
            <View className="gap-1">
              <Text className="text-center text-[12px] font-sans text-foreground">
                {item.name}
              </Text>
              <Text className="text-center text-[12px] font-sans text-muted-foreground">
                {item.weight_kg} kg
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
