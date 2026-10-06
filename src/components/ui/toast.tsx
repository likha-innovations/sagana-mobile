import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { create } from 'zustand';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  type: 'success',
  isVisible: false,
  showToast: (message, type = 'success') => set({ message, type, isVisible: true }),
  hideToast: () => set({ isVisible: false }),
}));

export function Toast() {
  const { message, type, isVisible, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(150);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSequence(
        withSpring(0, { damping: 14, stiffness: 120 }),
        withDelay(
          1000,
          withTiming(150, { duration: 300 }, () => {
            runOnJS(hideToast)();
          })
        )
      );
    } else {
      translateY.value = withTiming(150, { duration: 300 });
    }
  }, [isVisible, translateY, hideToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: Math.max(insets.bottom, 20) + 20,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
    >
      <View
        className={`flex-row items-center px-4 py-3.5 rounded-[8px] gap-3 shadow-sm ${
          type === 'success' ? 'bg-primary' : 'bg-destructive'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle color="white" size={20} />
        ) : (
          <XCircle color="white" size={20} />
        )}
        <Text className="text-white font-medium text-[14px] flex-1">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
