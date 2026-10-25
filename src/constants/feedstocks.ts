import type { ImageSourcePropType } from 'react-native';

export const FEEDSTOCK_IMAGES: Record<string, ImageSourcePropType> = {
  'Sawdust': require('@/assets/feedstocks/woodchips.png'),
  'Wood Shavings': require('@/assets/feedstocks/woodchips.png'),
  'Woodchips': require('@/assets/feedstocks/woodchips.png'),
  'Wood Chips': require('@/assets/feedstocks/woodchips.png'),
  'Vegetable Waste': require('@/assets/feedstocks/vegetable-waste.png'),
  'Vegetable Scraps': require('@/assets/feedstocks/vegetable-waste.png'),
  'Food Waste': require('@/assets/feedstocks/vegetable-waste.png'),
  'Fruit Peels': require('@/assets/feedstocks/vegetable-waste.png'),
  'Dry Leaves': require('@/assets/feedstocks/dried-leaves.png'),
  'Dried Leaves': require('@/assets/feedstocks/dried-leaves.png'),
  'Coffee Grounds': require('@/assets/feedstocks/coffee-grounds.png'),
  'Coffee': require('@/assets/feedstocks/coffee-grounds.png'),
  'Cardboards': require('@/assets/feedstocks/cardboards.png'),
  'Cardboard': require('@/assets/feedstocks/cardboards.png'),
  'Grass Clippings': require('@/assets/feedstocks/grass-clippings.png'),
};

export function getFeedstockImage(name: string): ImageSourcePropType | null {
  if (!name) return null;
  if (FEEDSTOCK_IMAGES[name]) return FEEDSTOCK_IMAGES[name];

  const normalized = name.trim().toLowerCase();
  const exactMatch = Object.keys(FEEDSTOCK_IMAGES).find(
    (key) => key.toLowerCase() === normalized
  );
  if (exactMatch) return FEEDSTOCK_IMAGES[exactMatch];

  // Match slight phrasing variations such as "Dried Leaves (Brown)"
  const partialMatch = Object.keys(FEEDSTOCK_IMAGES).find((key) => {
    const k = key.toLowerCase();
    return normalized.includes(k) || k.includes(normalized);
  });
  return partialMatch ? FEEDSTOCK_IMAGES[partialMatch] : null;
}
