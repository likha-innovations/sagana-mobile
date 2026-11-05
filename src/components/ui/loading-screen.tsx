import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function LoadingScreen() {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withRepeat(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
    return () => cancelAnimation(scale);
  }, [reduceMotion, scale]);

  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Sagana"
      accessibilityState={{ busy: true }}
    >
      <Animated.Image
        source={require("../../../assets/sagana_logo.png")}
        accessibilityIgnoresInvertColors
        accessible={false}
        resizeMode="contain"
        style={[{ width: 96, height: 96 }, animatedStyle]}
      />
    </View>
  );
}
