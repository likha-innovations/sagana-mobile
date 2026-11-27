import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants';

export interface ProgressBarProps {
  activeStep: number;
  totalSteps: number;
  initialStep?: number;
  width?: number;
  height?: number;
  gap?: number;
  pillWidth?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export interface ProgressSegmentLayout {
  inactiveWidth: number;
  activeWidth: number;
  clampedActiveStep: number;
}

export function computeProgressSegmentWidths(
  totalSteps: number,
  activeStep: number,
  width = 144,
  gap = 10,
  pillWidth = 18,
): ProgressSegmentLayout {
  const safeSteps = Math.max(1, Math.floor(totalSteps));
  const clampedActiveStep = Math.min(Math.max(1, Math.floor(activeStep)), safeSteps);
  if (safeSteps === 1) {
    return { inactiveWidth: pillWidth, activeWidth: width, clampedActiveStep };
  }

  const totalGaps = (safeSteps - 1) * gap;
  // Shrink inactive pills only when 6+ steps would compress the active pill below 1.5x
  const inactiveWidth = Math.max(
    6,
    Math.min(pillWidth, Math.floor((width - totalGaps) / (safeSteps + 0.5))),
  );
  const activeWidth = Math.max(inactiveWidth, width - totalGaps - (safeSteps - 1) * inactiveWidth);

  return { inactiveWidth, activeWidth, clampedActiveStep };
}

interface ProgressSegmentProps {
  isActive: boolean;
  isFilled: boolean;
  wasActive: boolean;
  wasFilled: boolean;
  activeWidth: number;
  inactiveWidth: number;
  height: number;
  activeColor: string;
  inactiveColor: string;
  reducedMotion: boolean;
}

function ProgressSegment({
  isActive,
  isFilled,
  wasActive,
  wasFilled,
  activeWidth,
  inactiveWidth,
  height,
  activeColor,
  inactiveColor,
  reducedMotion,
}: ProgressSegmentProps) {
  const targetWidth = isActive ? activeWidth : inactiveWidth;
  const targetFill = isFilled ? 1 : 0;

  const widthValue = useSharedValue(wasActive ? activeWidth : inactiveWidth);
  const fillValue = useSharedValue(wasFilled ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      widthValue.value = targetWidth;
      fillValue.value = targetFill;
      return;
    }

    widthValue.value = withTiming(targetWidth, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
    fillValue.value = withTiming(targetFill, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetWidth, targetFill, reducedMotion, widthValue, fillValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: widthValue.value,
    height,
    borderRadius: height,
    backgroundColor: interpolateColor(fillValue.value, [0, 1], [inactiveColor, activeColor]),
  }));

  return <Animated.View style={animatedStyle} />;
}

export function ProgressBar({
  activeStep,
  totalSteps,
  initialStep,
  width = 144,
  height = 6,
  gap = 10,
  pillWidth = 18,
  activeColor = colors.brand[500],
  inactiveColor = colors.gray.border,
}: ProgressBarProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const safeSteps = Math.max(1, Math.floor(totalSteps));
  const { inactiveWidth, activeWidth, clampedActiveStep } = computeProgressSegmentWidths(
    safeSteps,
    activeStep,
    width,
    gap,
    pillWidth,
  );
  const initialClamped =
    initialStep !== undefined
      ? Math.min(Math.max(1, Math.floor(initialStep)), safeSteps)
      : clampedActiveStep;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${clampedActiveStep} of ${safeSteps}`}
      accessibilityValue={{ min: 1, max: safeSteps, now: clampedActiveStep }}
      style={{ width, height, gap }}
      className="flex-row items-center justify-center"
    >
      {Array.from({ length: safeSteps }).map((_, index) => {
        const stepNumber = index + 1;
        return (
          <ProgressSegment
            key={stepNumber}
            isActive={stepNumber === clampedActiveStep}
            isFilled={stepNumber <= clampedActiveStep}
            wasActive={stepNumber === initialClamped}
            wasFilled={stepNumber <= initialClamped}
            activeWidth={activeWidth}
            inactiveWidth={inactiveWidth}
            height={height}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </View>
  );
}
