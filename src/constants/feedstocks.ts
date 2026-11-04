import type { ImageSourcePropType } from "react-native";

export const FEEDSTOCK_IMAGES: Record<string, ImageSourcePropType> = {
  Sawdust: require("@/assets/feedstocks/woodchips.png"),
  "Coffee Grounds": require("@/assets/feedstocks/coffee-grounds.png"),
  "Dry Leaves": require("@/assets/feedstocks/dried-leaves.png"),
  "Dried Leaves": require("@/assets/feedstocks/dried-leaves.png"),
  "Grass Clippings": require("@/assets/feedstocks/grass-clippings.png"),
  Cardboard: require("@/assets/feedstocks/cardboards.png"),
  Cardboards: require("@/assets/feedstocks/cardboards.png"),
  "Vegetable Waste": require("@/assets/feedstocks/vegetable-waste.png"),
  "Vegetable Scraps": require("@/assets/feedstocks/vegetable-waste.png"),
  "Food Waste": require("@/assets/feedstocks/vegetable-waste.png"),
  "Fruit Peels": require("@/assets/feedstocks/vegetable-waste.png"),
};

export function getFeedstockImage(name: string): ImageSourcePropType | null {
  if (!name) return null;
  if (FEEDSTOCK_IMAGES[name]) return FEEDSTOCK_IMAGES[name];

  const normalized = name.trim().toLowerCase();
  const matchKey = Object.keys(FEEDSTOCK_IMAGES).find(
    (key) => key.toLowerCase() === normalized,
  );

  return matchKey ? FEEDSTOCK_IMAGES[matchKey] : null;
}
