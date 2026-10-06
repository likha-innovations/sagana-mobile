import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '@/constants';

export function useDynamicLayout() {
  const insets = useSafeAreaInsets();

  // The floating tab bar overlays the screen. To prevent content from being trapped underneath,
  // we dynamically calculate its height based on the device's bottom inset (safe area).
  const tabBarHeight = layout.tabBar.contentHeight + Math.max(insets.bottom, layout.tabBar.minBottomPadding);
  
  // The padding to add to the bottom of ScrollViews so the last item clears the tab bar
  const scrollPaddingBottom = tabBarHeight + 100;
  
  // The absolute bottom offset for floating pills/buttons to sit right above the tab bar
  const floatingBottom = tabBarHeight + 24;

  return {
    insets,
    tabBarHeight,
    scrollPaddingBottom,
    floatingBottom,
  };
}
