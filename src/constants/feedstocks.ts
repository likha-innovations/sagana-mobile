import type { ImageSourcePropType } from 'react-native';

export const FEEDSTOCK_IMAGES: Record<string, ImageSourcePropType> = {
  'Sawdust': require('@/assets/feedstocks/woodchips.png'),
  'Vegetable Waste': require('@/assets/feedstocks/vegetable-waste.png'),
  'Vegetable Scraps': require('@/assets/feedstocks/vegetable-waste.png'),
  'Food Waste': require('@/assets/feedstocks/vegetable-waste.png'),
  'Fruit Peels': require('@/assets/feedstocks/vegetable-waste.png'),
};

export function getFeedstockImage(name: string): ImageSourcePropType | null {
  if (!name) return null;
  if (FEEDSTOCK_IMAGES[name]) return FEEDSTOCK_IMAGES[name];

  const normalized = name.trim().toLowerCase();
  const matchKey = Object.keys(FEEDSTOCK_IMAGES).find(
    (key) => key.toLowerCase() === normalized
  );

  return matchKey ? FEEDSTOCK_IMAGES[matchKey] : null;
}
