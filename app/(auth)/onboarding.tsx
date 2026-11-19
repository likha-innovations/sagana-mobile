import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { ProgressBar } from '@/components/auth';
import { setOnboardingCompleted } from '@/lib/onboarding-storage';

interface Slide {
  id: string;
  source: any;
  step?: number;
  title: string;
  titleHighlight?: string;
  description?: string;
  descHighlight?: string;
  cta: string;
}

const SLIDES: Slide[] = [
  // Frame 13: Wow, a new SAGANA User!
  {
    id: 'wow-user',
    source: require('@/assets/icons/mascot/onboarding/sagana_celebration.lottie'),
    title: 'Wow, a new SAGANA User!',
    titleHighlight: 'SAGANA',
    cta: 'Next',
  },
  // Frame 15: Welcome to SAGANA!
  {
    id: 'welcome-buchikek',
    source: require('@/assets/icons/mascot/onboarding/sagana_mascot_machine.lottie'),
    title: 'Welcome to SAGANA!',
    description: 'I am Buchikek, your SAGANA companion! Let me walk you through what benefits you’ll get from us!',
    descHighlight: 'Buchikek',
    cta: 'Next',
  },
  // Frame 12: Flow Step 1 - Pick your feedstock
  {
    id: 'step-feedstock',
    source: require('@/assets/icons/mascot/onboarding/sagana_food_scraps.lottie'),
    step: 1,
    title: 'Pick your feedstock',
    description: 'Choose and log the feedstocks you will put in the machine digitally.',
    cta: 'Next',
  },
  // Frame 9: Flow Step 2 - Let the machine do the work
  {
    id: 'step-machine-work',
    source: require('@/assets/icons/mascot/onboarding/sagana_mascot_machine.lottie'),
    step: 2,
    title: 'Let the machine do the work',
    description: 'Our AIVSP machine automatically manages and helps maintain composting conditions.',
    cta: 'Next',
  },
  // Frame 10: Flow Step 3 - From waste to compost
  {
    id: 'step-waste-to-compost',
    source: require('@/assets/icons/mascot/onboarding/sagana_food_to_compost.lottie'),
    step: 3,
    title: 'From waste to compost',
    description: 'Know when to collect the curing-ready compost that has been processed in the machine.',
    cta: 'Next',
  },
  // Frame 11: Flow Step 4 - Better and efficient operations
  {
    id: 'step-efficient-operations',
    source: require('@/assets/icons/mascot/onboarding/sagana_composting_process.lottie'),
    step: 4,
    title: 'Better and efficient operations',
    description: 'Monitor your composting batches, track machine conditions, and manage daily operations—all in one app.',
    cta: 'Get Started',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  // Compute proportional mascot container from explicit window dimensions
  const mascotBoxSize = Math.min(width * 0.85, height * 0.42, 330);

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
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 24),
      }}
      className="bg-background justify-between"
    >
      {/* Top Bar */}
      <View className="w-full h-11 flex-row items-center justify-between px-4 relative">
        <View className="w-[30px] h-[30px] justify-center">
          {!isFirst && (
            <Pressable
              onPress={() => setIndex((i) => i - 1)}
              hitSlop={12}
              className="w-[30px] h-[30px] items-center justify-center -ml-1 active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color="#718619" />
            </Pressable>
          )}
        </View>

        {slide.step !== undefined && (
          <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
            <ProgressBar activeStep={slide.step} totalSteps={4} />
          </View>
        )}

        <Pressable
          onPress={handleFinish}
          hitSlop={12}
          className="h-[30px] items-center justify-center active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text className="font-bold text-[16px] text-primary" style={{ fontFamily: 'SpotifyMix-Bold' }}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Center Mascot Illustration bounded by window dimensions */}
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

      {/* Bottom Content & CTA */}
      <View className="w-full px-5">
        <View className="gap-2.5 mb-8">
          <Text className="text-[20px] font-bold text-foreground text-left" style={{ fontFamily: 'SpotifyMix-Bold' }}>
            {slide.titleHighlight ? (
              <>
                {slide.title.split(slide.titleHighlight)[0]}
                <Text className="text-primary">{slide.titleHighlight}</Text>
                {slide.title.split(slide.titleHighlight)[1]}
              </>
            ) : (
              slide.title
            )}
          </Text>

          {slide.description && (
            <Text className="text-[14px] text-foreground text-left leading-5" style={{ fontFamily: 'SpotifyMix-Regular' }}>
              {slide.descHighlight ? (
                <>
                  {slide.description.split(slide.descHighlight)[0]}
                  <Text className="font-bold text-primary" style={{ fontFamily: 'SpotifyMix-Bold' }}>
                    {slide.descHighlight}
                  </Text>
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
          className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90 shadow-sm"
          accessibilityRole="button"
          accessibilityLabel={slide.cta}
        >
          <Text className="font-bold text-[16px] text-primary-foreground" style={{ fontFamily: 'SpotifyMix-Bold' }}>
            {slide.cta}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
