import React, { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { Text } from '@/components/ui/text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { setOnboardingCompleted } from '@/lib/onboarding-storage';
import { useDynamicLayout } from '@/hooks';

interface Slide {
  id: string;
  source: any;
  step?: number;
  showBack: boolean;
  showSkip: boolean;
  isWordmark?: boolean;
  title: string;
  titleHighlight?: string;
  description?: string;
  descHighlight?: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    id: 'wow-user',
    source: require('@/assets/icons/mascot/onboarding/sagana_hardhat_mascot_blink.lottie'),
    showBack: false,
    showSkip: false,
    title: 'Wow, a new SAGANA User!',
    titleHighlight: 'SAGANA',
    cta: 'Next',
  },
  {
    id: 'welcome-garby',
    source: require('@/assets/icons/mascot/onboarding/sagana_logo_wordmark.lottie'),
    showBack: false,
    showSkip: false,
    isWordmark: true,
    title: 'Welcome to SAGANA!',
    description:
      'I am Garby, your SAGANA companion! Let me walk you through what benefits you’ll get from us!',
    descHighlight: 'Garby',
    cta: 'Next',
  },
  {
    id: 'step-feedstock',
    source: require('@/assets/icons/mascot/onboarding/sagana_food_scraps.lottie'),
    step: 1,
    showBack: false,
    showSkip: true,
    title: 'Pick your feedstock',
    description: 'Choose and log the feedstocks you will put in the machine digitally.',
    cta: 'Next',
  },
  {
    id: 'step-machine-work',
    source: require('@/assets/icons/mascot/onboarding/sagana_mascot_machine.lottie'),
    step: 2,
    showBack: true,
    showSkip: true,
    title: 'Let the machine do the work',
    description: 'Our AIVSP machine automatically manages and helps maintain composting conditions.',
    cta: 'Next',
  },
  {
    id: 'step-waste-to-compost',
    source: require('@/assets/icons/mascot/onboarding/sagana_food_to_compost.lottie'),
    step: 3,
    showBack: true,
    showSkip: true,
    title: 'From waste to compost',
    description:
      'Know when to collect the curing-ready compost that has been processed in the machine.',
    cta: 'Next',
  },
  {
    id: 'step-efficient-operations',
    source: require('@/assets/icons/mascot/onboarding/sagana_composting_process.lottie'),
    step: 4,
    showBack: true,
    showSkip: true,
    title: 'Better and efficient operations',
    description:
      'Monitor your composting batches, track machine conditions, and manage daily operations, all in one app.',
    cta: 'Continue to sign in',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const { headerPaddingTop, stackScrollPadding } = useDynamicLayout();

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  // Wordmark Lottie has a 512x512 square canvas; keep square bounds so it scales cleanly across width
  const mascotBoxSize = slide.isWordmark
    ? Math.min(width * 0.92, height * 0.45, 360)
    : Math.min(width * 0.85, height * 0.42, 331);

  const handleFinish = async () => {
    await setOnboardingCompleted();
    router.replace('/(auth)/sign-in');
  };

  const handleNext = () => {
    if (isLast) {
      void handleFinish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <View
      style={{
        width,
        height,
        paddingTop: headerPaddingTop,
        paddingBottom: Math.max(stackScrollPadding, 48),
      }}
      className="bg-background justify-between"
    >
      <View className="w-full h-11 flex-row items-center justify-between px-4 relative">
        <View className="w-11 h-11 justify-center">
          {slide.showBack && (
            <Pressable
              onPress={() => setIndex((i) => i - 1)}
              hitSlop={12}
              className="w-11 h-11 items-center justify-center -ml-2 active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={28} color="#718619" />
            </Pressable>
          )}
        </View>

        {slide.step !== undefined && (
          <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
            <ProgressBar activeStep={slide.step} totalSteps={4} />
          </View>
        )}

        <View className="min-w-11 h-11 justify-center items-end">
          {slide.showSkip && (
            <Pressable
              onPress={handleFinish}
              hitSlop={12}
              className="min-h-11 px-1 items-center justify-center active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text className="font-bold text-base text-primary">Skip</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View
        style={{
          width,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="px-4"
      >
        <View style={{ width: mascotBoxSize, height: mascotBoxSize }} className="items-center justify-center">
          <LottieView
            key={slide.id}
            source={slide.source}
            autoPlay
            loop
            cacheComposition
            renderMode="HARDWARE"
            hardwareAccelerationAndroid
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </View>

      <View className="w-full px-4 min-h-47 justify-between gap-8">
        <View className="gap-2.5">
          <Text className="text-xl font-bold text-foreground text-left">
            {slide.titleHighlight ? (
              <>
                {slide.title.split(slide.titleHighlight)[0]}
                <Text className="text-xl font-bold text-primary">{slide.titleHighlight}</Text>
                {slide.title.split(slide.titleHighlight)[1]}
              </>
            ) : (
              slide.title
            )}
          </Text>

          {slide.description && (
            <Text className="text-sm font-sans text-foreground text-left leading-5">
              {slide.descHighlight ? (
                <>
                  {slide.description.split(slide.descHighlight)[0]}
                  <Text className="text-sm font-bold text-primary">{slide.descHighlight}</Text>
                  {slide.description.split(slide.descHighlight)[1]}
                </>
              ) : (
                slide.description
              )}
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleNext}
          className="w-full min-h-11 py-3 rounded-full bg-primary items-center justify-center active:opacity-90 shadow-sm"
          accessibilityRole="button"
          accessibilityLabel={slide.cta}
        >
          <Text className="font-bold text-sm text-primary-foreground">{slide.cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}
