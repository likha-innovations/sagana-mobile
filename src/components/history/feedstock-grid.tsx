import {
  View,
  Text,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { Image } from "expo-image";
import type { BatchFeedstock } from "@/types/batch";

const images: Record<string, ImageSourcePropType> = {
  "Coffee Grounds": require("@/assets/feedstocks/coffee-grounds.png"),
  Cardboards: require("@/assets/feedstocks/cardboards.png"),
  "Grass Clippings": require("@/assets/feedstocks/grass-clippings.png"),
  "Dried Leaves": require("@/assets/feedstocks/dried-leaves.png"),
  Woodchips: require("@/assets/feedstocks/woodchips.png"),
  "Vegetable Waste": require("@/assets/feedstocks/vegetable-waste.png"),
};
export function FeedstockGrid({
  feedstocks,
}: {
  feedstocks: BatchFeedstock[];
}) {
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.6 ? 1 : width < 360 || fontScale > 1.2 ? 2 : 3;
  return (
    <View className="flex-row flex-wrap gap-y-8">
      {feedstocks.map((item) => (
        <View
          key={item.id}
          style={{ width: `${100 / columns}%` }}
          className="items-center gap-2 px-2 py-5"
        >
          {images[item.name] && (
            <Image
              source={images[item.name]}
              style={{ width: 74, height: 60 }}
              contentFit="contain"
              accessible={false}
            />
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
      ))}
    </View>
  );
}
