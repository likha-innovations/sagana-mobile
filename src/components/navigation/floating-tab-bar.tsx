import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { createLogger } from '@/lib/logger';
import { colors } from '@/constants';

const logger = createLogger('Navigation');

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <View style={styles.tabContainer}>
        {state.routes.map(
          (route: (typeof state.routes)[number], index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              if (!isFocused && !event.defaultPrevented) {
                logger.screen(route.name);
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const activeColor = colors.brand[500];
            const inactiveColor = colors.gray.textIcon;
            const color = isFocused ? activeColor : inactiveColor;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
              >
                <View style={styles.iconContainer}>
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color,
                    size: 24,
                  })}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    { color },
                  ]}
                  numberOfLines={1}
                >
                  {typeof label === 'string' ? label : ''}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white.bg,
    borderTopWidth: 1,
    borderTopColor: colors.gray.border,
    zIndex: 100,
  },
  tabContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 15,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'SpotifyMix-Regular',
  },
});
