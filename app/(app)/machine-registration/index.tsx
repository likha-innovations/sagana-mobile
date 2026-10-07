import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Wifi, Info } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { FloatingInputField, ProgressBar } from '@/components/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MachineRegistration');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 1 | 2 | 3 | 4 | 5;

// Maps each internal step to its progress bar position
const PROGRESS_STEP: Record<Step, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 4,
};

const STEP_TITLES: Record<Step, string> = {
  1: 'Turn on your machine',
  2: 'Connect to your machine',
  3: 'Connect to your machine',
  4: 'Enter your Wi-Fi credentials',
  5: 'Name your machine',
};

export default function MachineRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);

  // Step 2 scan state
  const [isScanning, setIsScanning] = useState(false);
  const [isFound, setIsFound] = useState(false);

  // Step 4 form state
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [ssidError, setSsidError] = useState(false);
  const [wifiPasswordError, setWifiPasswordError] = useState(false);

  // Step 5 form state
  const [machineName, setMachineName] = useState('');
  const [nameError, setNameError] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ssidRef = useRef<TextInput>(null);
  const wifiPasswordRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  // Horizontal slide shared value — positive = right of screen, negative = left
  const slideX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const clearErrors = () => {
    setSsidError(false);
    setWifiPasswordError(false);
    setNameError(false);
    setErrorMessage(null);
  };

  // Slides current content out, swaps step, slides new content in
  const transitionTo = useCallback(
    (nextStep: Step, direction: 'forward' | 'back') => {
      const outX = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;
      const inX = direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH;

      slideX.value = withTiming(
        outX,
        { duration: 180, easing: Easing.out(Easing.ease) },
        (finished) => {
          if (!finished) return;
          runOnJS(setStep)(nextStep);
          slideX.value = inX;
          slideX.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
        }
      );
    },
    [slideX]
  );

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1) {
      router.back();
      return;
    }
    clearErrors();
    transitionTo((step - 1) as Step, 'back');
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsScanning(true);
    setIsFound(false);
    logger.info('Machine scan started');
    // Phase 4: replace with actual BLE discovery
    setTimeout(() => {
      setIsScanning(false);
      setIsFound(true);
      logger.info('Machine discovered');
    }, 2500);
  };

  const handleNext = async () => {
    Keyboard.dismiss();

    if (step === 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      transitionTo(2, 'forward');
      return;
    }

    if (step === 2) {
      if (!isFound) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      transitionTo(3, 'forward');
      return;
    }

    if (step === 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      transitionTo(4, 'forward');
      return;
    }

    if (step === 4) {
      const trimSsid = ssid.trim();
      const trimPassword = wifiPassword.trim();
      if (!trimSsid || !trimPassword) {
        if (!trimSsid) setSsidError(true);
        if (!trimPassword) setWifiPasswordError(true);
        setErrorMessage('Please enter your Wi-Fi credentials');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      transitionTo(5, 'forward');
      return;
    }

    if (step === 5) {
      if (!machineName.trim()) {
        setNameError(true);
        setErrorMessage('Please enter a required field');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setLoading(true);
      try {
        // Phase 4: replace with real registration API call
        logger.info('Submitting machine registration', { name: machineName.trim() });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/(app)/machine-registration/step-6');
      } catch (err: unknown) {
        logger.error('Machine registration failed', err);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setNameError(true);
        setErrorMessage('Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Whether the primary CTA should show or the secondary (gray) Scan button
  const showSecondaryCta = step === 2 && !isFound;

  const ctaLabel = (() => {
    if (step === 2 && !isFound) return 'Scan';
    if (step === 5) return 'Register';
    return 'Next';
  })();

  const isCtaDisabled =
    loading ||
    isScanning ||
    (step === 4 && (!ssid.trim() || !wifiPassword.trim())) ||
    (step === 5 && !machineName.trim());

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              Once powered on, your SAGANA AVSP Machine should emit a 2.4GHz Wi-Fi signal to proceed.
            </Text>
            <View className="w-full h-[200px] bg-skeleton rounded-2xl mt-6" />
          </>
        );

      case 2:
        return (
          <>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              Connect to the Wi-Fi network of your AVSP Machine to continue.
            </Text>
            <View className="w-full h-[200px] bg-skeleton rounded-2xl mt-6 items-center justify-center gap-3">
              {isScanning ? (
                <>
                  <ActivityIndicator size="large" color="#718619" />
                  <Text className="text-[13px] font-sans text-muted-foreground">
                    Scanning for nearby machines...
                  </Text>
                </>
              ) : isFound ? (
                <>
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                    <Wifi size={24} color="#718619" />
                  </View>
                  <Text className="text-[14px] font-semibold text-foreground">Machine found</Text>
                  <Text className="text-[13px] font-sans text-muted-foreground">SAGANA-AVSP-001</Text>
                </>
              ) : (
                <Text className="text-[13px] font-sans text-muted-foreground">
                  Tap Scan to discover nearby machines
                </Text>
              )}
            </View>
          </>
        );

      case 3:
        return (
          <>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              Connect to the Wi-Fi network of your AVSP Machine to continue.
            </Text>
            <View className="w-full bg-skeleton rounded-2xl p-5 gap-4 mt-6">
              <View className="flex-row items-center gap-3">
                <View className="w-3 h-3 rounded-full bg-[#6CAD6C]" />
                <Text className="text-[14px] font-semibold text-foreground">Connected</Text>
              </View>
              <View className="flex-row items-center gap-3 bg-background rounded-xl p-4">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Wifi size={20} color="#718619" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[14px] font-semibold text-foreground">SAGANA-AVSP-001</Text>
                  <Text className="text-[12px] font-sans text-muted-foreground">AVSP Machine · 2.4GHz</Text>
                </View>
              </View>
            </View>
          </>
        );

      case 4:
        return (
          <>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              To connect your AVSP Machine to your network, you must enter your Wi-Fi credentials.
            </Text>
            <View className="w-full gap-3 mt-6">
              <FloatingInputField
                label="SSID"
                value={ssid}
                onChangeText={(text) => {
                  setSsid(text);
                  if (ssidError) { setSsidError(false); setErrorMessage(null); }
                }}
                hasError={ssidError}
                autoCapitalize="none"
                returnKeyType="next"
                inputRef={ssidRef}
                onSubmitEditing={() => wifiPasswordRef.current?.focus()}
              />
              <FloatingInputField
                label="Wi-Fi Password"
                value={wifiPassword}
                onChangeText={(text) => {
                  setWifiPassword(text);
                  if (wifiPasswordError) { setWifiPasswordError(false); setErrorMessage(null); }
                }}
                hasError={wifiPasswordError}
                isPassword
                returnKeyType="done"
                inputRef={wifiPasswordRef}
                onSubmitEditing={handleNext}
              />
              {errorMessage && (
                <Text className="text-[13px] font-sans text-destructive mt-1 ml-1 text-left">
                  {errorMessage}
                </Text>
              )}
              <View className="flex-row items-start gap-2 mt-1">
                <Info size={14} color="#AFAEA7" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-[12px] font-sans text-muted-foreground leading-[18px]">
                  If you ever change your Wi-Fi credentials, you must reconnect the machine through the app.
                </Text>
              </View>
            </View>
          </>
        );

      case 5:
        return (
          <>
            <Text className="text-[14px] font-sans text-foreground text-left leading-5">
              Give a name to your new SAGANA AVSP Machine.
            </Text>
            <View className="w-full gap-1 mt-6">
              <FloatingInputField
                label="Machine Name"
                value={machineName}
                onChangeText={(text) => {
                  setMachineName(text);
                  if (nameError) { setNameError(false); setErrorMessage(null); }
                }}
                hasError={nameError}
                autoCapitalize="words"
                returnKeyType="done"
                inputRef={nameRef}
                onSubmitEditing={handleNext}
              />
              {errorMessage && (
                <Text className="text-[13px] font-sans text-destructive mt-1 ml-1 text-left">
                  {errorMessage}
                </Text>
              )}
            </View>
          </>
        );
    }
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-4 items-center justify-between pb-10">
            <View className="w-full max-w-[380px] pt-4">

              {/* Fixed header — does not animate with content */}
              <View className="w-full h-11 flex-row items-center justify-between relative mb-6">
                <Pressable
                  onPress={handleBack}
                  hitSlop={12}
                  className="w-[30px] h-[30px] items-center justify-center -ml-1"
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ChevronLeft size={24} color="#414141" />
                </Pressable>

                <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
                  <ProgressBar activeStep={PROGRESS_STEP[step]} totalSteps={5} />
                </View>
                <View className="w-[30px]" />
              </View>

              {/* Animated content — title + body slide together */}
              <View style={{ overflow: 'hidden' }}>
                <Animated.View style={animatedStyle} className="w-full gap-2.5">
                  <Text className="text-[20px] font-bold text-foreground text-left">
                    {STEP_TITLES[step]}
                  </Text>
                  {renderStepContent()}
                </Animated.View>
              </View>
            </View>

            {/* Fixed CTA — stays in place as content slides */}
            <View className="w-full max-w-[380px]">
              <Pressable
                onPress={showSecondaryCta ? handleScan : handleNext}
                disabled={isCtaDisabled}
                className={`w-full h-[45px] rounded-full items-center justify-center active:opacity-90 disabled:opacity-60 ${showSecondaryCta ? 'bg-secondary' : 'bg-primary'}`}
                accessibilityRole="button"
              >
                {loading || isScanning ? (
                  <ActivityIndicator
                    color={showSecondaryCta ? '#414141' : '#FAF9EE'}
                    size="small"
                  />
                ) : (
                  <Text
                    className={`text-[14px] font-bold ${showSecondaryCta ? 'text-foreground' : 'text-primary-foreground'}`}
                  >
                    {ctaLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
