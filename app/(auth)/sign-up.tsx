import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ChevronLeft, Eye, EyeOff, X } from 'lucide-react-native';
import { GoogleIcon } from '@/components/icons';
import { ErrorModal } from '@/components/ui/error-modal';
import { PolicyBottomSheet } from '@/components/auth';
import { useAuthContext } from '@/context/auth-context';
import { cn } from '@/lib/utils';

// --- Figma Component: 2-Segment Progress Bar (144px x 6px) for Account Creation ---
function AccountCreationProgressBar({ activeStep }: { activeStep: 1 | 2 }) {
  return (
    <View className="flex-row items-center gap-[10px] w-[144px] h-[6px]">
      <View
        className={cn(
          'flex-1 h-full rounded-[14px]',
          activeStep >= 1 ? 'bg-primary' : 'bg-[#C8C7BE]'
        )}
      />
      <View
        className={cn(
          'flex-1 h-full rounded-[14px]',
          activeStep >= 2 ? 'bg-primary' : 'bg-[#C8C7BE]'
        )}
      />
    </View>
  );
}

// --- Figma Component: Floating Label Input Field (58px height, rounded-2xl) ---
interface FloatingInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  clearable?: boolean;
  hasError?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: RefObject<TextInput | null>;
}

function FloatingInputField({
  label,
  value,
  onChangeText,
  isPassword = false,
  clearable = false,
  hasError = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: FloatingInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const floatProgress = useSharedValue(hasValue ? 1 : 0);

  useEffect(() => {
    floatProgress.value = withTiming(isFloating ? 1 : 0, {
      duration: 170,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isFloating, floatProgress]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatProgress.value, [0, 1], [0, -10]);
    const scale = interpolate(floatProgress.value, [0, 1], [1, 0.78]);

    return {
      transform: [{ translateY }, { scale }],
      transformOrigin: 'left center',
    };
  });

  return (
    <Pressable
      onPress={() => inputRef?.current?.focus()}
      className={cn(
        'w-full h-[58px] rounded-2xl border-[1.5px] px-5 flex-row items-center justify-between bg-background transition-colors',
        hasError
          ? 'border-destructive bg-destructive/[0.03]'
          : isFocused
            ? 'border-foreground/40'
            : 'border-input'
      )}
    >
      <View className="flex-1 justify-center h-full relative">
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 19,
            },
            animatedLabelStyle,
          ]}
        >
          <Text
            className={cn(
              'text-[14px] font-sans select-none',
              hasError
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            )}
          >
            {label}
          </Text>
        </Animated.View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            paddingTop: isFloating ? 14 : 0,
          }}
          className="text-[14px] font-sans text-foreground p-0 m-0 w-full h-full"
        />
      </View>

      {isPassword && hasValue && (
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={8}
          className="p-1 -mr-1"
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff size={18} color={hasError ? '#E84C4C' : '#414141'} />
          ) : (
            <Eye size={18} color={hasError ? '#E84C4C' : '#414141'} />
          )}
        </Pressable>
      )}

      {clearable && hasValue && isFocused && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          className="p-1 -mr-1"
          accessibilityRole="button"
          accessibilityLabel="Clear input"
        >
          <X size={16} color="#414141" />
        </Pressable>
      )}
    </Pressable>
  );
}

// --- Figma Component: Fluid 6-Box OTP Input Field ---
interface OtpInputGroupProps {
  code: string;
  onChangeCode: (code: string) => void;
  hasError?: boolean;
}

function OtpInputGroup({ code, onChangeCode, hasError = false }: OtpInputGroupProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCharChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const codeArr = code.padEnd(6, ' ').split('');

    if (cleaned.length > 0) {
      codeArr[index] = cleaned[cleaned.length - 1];
      const newCode = codeArr.join('').trimEnd();
      onChangeCode(newCode);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const codeArr = code.padEnd(6, ' ').split('');
      if (codeArr[index] && codeArr[index] !== ' ') {
        codeArr[index] = ' ';
        onChangeCode(codeArr.join('').trimEnd());
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const prevArr = code.padEnd(6, ' ').split('');
        prevArr[index - 1] = ' ';
        onChangeCode(prevArr.join('').trimEnd());
      }
    }
  };

  return (
    <View className="w-full flex-row justify-between items-center gap-1.5 sm:gap-2 max-w-[380px]">
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const digit = code[index] || '';
        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleCharChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            className={cn(
              'flex-1 max-w-[50px] aspect-[50/58] rounded-2xl border-[1.5px] bg-background text-[22px] font-bold text-foreground p-0',
              hasError
                ? 'border-destructive text-destructive'
                : digit
                  ? 'border-foreground/40'
                  : 'border-input'
            )}
          />
        );
      })}
    </View>
  );
}

// Segmented Direct Number Input for Date of Birth (MM / DD / YYYY)
interface SegmentedDateInputProps {
  month: string;
  day: string;
  year: string;
  onChangeMonth: (m: string) => void;
  onChangeDay: (d: string) => void;
  onChangeYear: (y: string) => void;
  hasError?: boolean;
  onSubmitEditing?: () => void;
  monthRef: RefObject<TextInput | null>;
  dayRef: RefObject<TextInput | null>;
  yearRef: RefObject<TextInput | null>;
}

function SegmentedDateInput({
  month,
  day,
  year,
  onChangeMonth,
  onChangeDay,
  onChangeYear,
  hasError = false,
  onSubmitEditing,
  monthRef,
  dayRef,
  yearRef,
}: SegmentedDateInputProps) {
  const [focusedField, setFocusedField] = useState<'month' | 'day' | 'year' | null>(null);

  const handleMonthChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 2) {
      const m = cleaned.slice(0, 2);
      const d = cleaned.slice(2, 4);
      const y = cleaned.slice(4, 8);
      onChangeMonth(m);
      if (d) onChangeDay(d);
      if (y) onChangeYear(y);
      if (y.length === 4) {
        Keyboard.dismiss();
      } else if (d.length === 2) {
        yearRef.current?.focus();
      } else {
        dayRef.current?.focus();
      }
      return;
    }

    onChangeMonth(cleaned);
    if (cleaned.length === 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dayRef.current?.focus();
    }
  };

  const handleDayChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    onChangeDay(cleaned);
    if (cleaned.length === 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    onChangeYear(cleaned);
    if (cleaned.length === 4) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Keyboard.dismiss();
    }
  };

  const handleDayKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && (!day || day.length === 0)) {
      monthRef.current?.focus();
    }
  };

  const handleYearKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && (!year || year.length === 0)) {
      dayRef.current?.focus();
    }
  };

  return (
    <View className="w-full">
      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
        Date of Birth
      </Text>
      <View className="w-full flex-row items-center justify-between gap-2.5">
        <Pressable
          onPress={() => monthRef.current?.focus()}
          className={cn(
            'flex-1 h-[58px] rounded-2xl border-[1.5px] bg-background items-center justify-center px-2',
            hasError
              ? 'border-destructive bg-destructive/[0.03]'
              : focusedField === 'month'
                ? 'border-foreground/40'
                : 'border-input'
          )}
        >
          <Text className="text-[10px] font-sans text-muted-foreground uppercase mb-0.5">
            Month
          </Text>
          <TextInput
            ref={monthRef}
            value={month}
            onChangeText={handleMonthChange}
            onFocus={() => setFocusedField('month')}
            onBlur={() => setFocusedField(null)}
            placeholder="MM"
            placeholderTextColor="#96958F"
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            className="text-[16px] font-bold text-foreground p-0 m-0 w-full"
            returnKeyType="next"
            onSubmitEditing={() => dayRef.current?.focus()}
          />
        </Pressable>

        <Text className="text-[18px] font-sans text-muted-foreground select-none">
          /
        </Text>

        <Pressable
          onPress={() => dayRef.current?.focus()}
          className={cn(
            'flex-1 h-[58px] rounded-2xl border-[1.5px] bg-background items-center justify-center px-2',
            hasError
              ? 'border-destructive bg-destructive/[0.03]'
              : focusedField === 'day'
                ? 'border-foreground/40'
                : 'border-input'
          )}
        >
          <Text className="text-[10px] font-sans text-muted-foreground uppercase mb-0.5">
            Day
          </Text>
          <TextInput
            ref={dayRef}
            value={day}
            onChangeText={handleDayChange}
            onKeyPress={handleDayKeyPress}
            onFocus={() => setFocusedField('day')}
            onBlur={() => setFocusedField(null)}
            placeholder="DD"
            placeholderTextColor="#96958F"
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            className="text-[16px] font-bold text-foreground p-0 m-0 w-full"
            returnKeyType="next"
            onSubmitEditing={() => yearRef.current?.focus()}
          />
        </Pressable>

        <Text className="text-[18px] font-sans text-muted-foreground select-none">
          /
        </Text>

        <Pressable
          onPress={() => yearRef.current?.focus()}
          className={cn(
            'flex-[1.4] h-[58px] rounded-2xl border-[1.5px] bg-background items-center justify-center px-2',
            hasError
              ? 'border-destructive bg-destructive/[0.03]'
              : focusedField === 'year'
                ? 'border-foreground/40'
                : 'border-input'
          )}
        >
          <Text className="text-[10px] font-sans text-muted-foreground uppercase mb-0.5">
            Year
          </Text>
          <TextInput
            ref={yearRef}
            value={year}
            onChangeText={handleYearChange}
            onKeyPress={handleYearKeyPress}
            onFocus={() => setFocusedField('year')}
            onBlur={() => setFocusedField(null)}
            placeholder="YYYY"
            placeholderTextColor="#96958F"
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
            className="text-[16px] font-bold text-foreground p-0 m-0 w-full"
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
          />
        </Pressable>
      </View>
    </View>
  );
}

type SignUpStep = 'email' | 'otp' | 'name' | 'birthday';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const isCompact = screenHeight < 720;
  const { signUp, verifyEmail, completeSignUp, isLoaded } = useAuthContext();

  const [step, setStep] = useState<SignUpStep>('email');

  // Step 1: Email Form State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  const emailInputRef = useRef<TextInput>(null);

  // Step 2: OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(59);

  // Step 3: Name State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState<string | null>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  // Step 4: Birthday State (Segmented MM / DD / YYYY)
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthdayError, setBirthdayError] = useState(false);
  const [birthdayErrorMessage, setBirthdayErrorMessage] = useState<string | null>(null);
  const birthMonthRef = useRef<TextInput>(null);
  const birthDayRef = useRef<TextInput>(null);
  const birthYearRef = useRef<TextInput>(null);

  // Modals
  const [loading, setLoading] = useState(false);
  const policySheetRef = useRef<BottomSheetModal>(null);
  const [policyType, setPolicyType] = useState<'tos' | 'privacy' | null>(null);
  const [emailTakenModal, setEmailTakenModal] = useState(false);
  const [generalErrorModal, setGeneralErrorModal] = useState(false);

  const handleOpenPolicy = useCallback((type: 'tos' | 'privacy') => {
    setPolicyType(type);
    requestAnimationFrame(() => {
      policySheetRef.current?.present();
    });
  }, []);

  const handlePolicyDismiss = useCallback(() => {
    setPolicyType(null);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleBack = () => {
    if (step === 'birthday') {
      setStep('name');
    } else if (step === 'name') {
      setStep('otp');
    } else if (step === 'otp') {
      setStep('email');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  // --- Step 1: Submit Email ---
  const handleNextEmail = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(true);
      setEmailErrorMessage('Please provide your email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setEmailError(false);
    setEmailErrorMessage(null);

    try {
      if (isLoaded) {
        await signUp(trimmed);
      }
      setResendCooldown(59);
      setStep('otp');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('taken') || msg.includes('already exists') || err?.status === 422) {
        setEmailTakenModal(true);
      } else {
        setGeneralErrorModal(true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verify OTP ---
  const handleVerifyOtp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmedCode = otpCode.trim();
    if (trimmedCode.length !== 6) {
      setOtpError(true);
      setOtpErrorMessage('Incorrect one time code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setOtpError(false);
    setOtpErrorMessage(null);

    try {
      if (isLoaded) {
        await verifyEmail(trimmedCode);
      }
      setStep('name');
    } catch {
      setOtpError(true);
      setOtpErrorMessage('Incorrect one time code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      if (isLoaded && email.trim()) {
        await signUp(email.trim());
      }
      setResendCooldown(59);
      setOtpCode('');
      setOtpError(false);
      setOtpErrorMessage(null);
    } catch {
      setGeneralErrorModal(true);
    }
  };

  // --- Step 3: Validate Name ---
  const handleNextName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      setNameError(true);
      setNameErrorMessage('Please enter your full name');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setNameError(false);
    setNameErrorMessage(null);
    setStep('birthday');
  };

  // --- Step 4: Finish Birthday & Complete Registration ---
  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const m = birthMonth.trim();
    const d = birthDay.trim();
    const y = birthYear.trim();

    if (!m || !d || !y) {
      setBirthdayError(true);
      setBirthdayErrorMessage('Please enter your complete date of birth');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const monthNum = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    const yearNum = parseInt(y, 10);
    const currentYear = new Date().getFullYear();

    if (monthNum < 1 || monthNum > 12) {
      setBirthdayError(true);
      setBirthdayErrorMessage('Please enter a valid month (01–12)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (yearNum < 1900 || yearNum > currentYear) {
      setBirthdayError(true);
      setBirthdayErrorMessage(`Please enter a valid year between 1900 and ${currentYear}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) {
      setBirthdayError(true);
      setBirthdayErrorMessage(`Please enter a valid day for the chosen month (01–${daysInMonth})`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (yearNum > currentYear - 5) {
      setBirthdayError(true);
      setBirthdayErrorMessage('Please enter a valid birth year');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const formattedBirthday = `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
    setBirthdayError(false);
    setBirthdayErrorMessage(null);
    setLoading(true);

    try {
      if (isLoaded) {
        await completeSignUp(firstName, lastName, formattedBirthday);
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch {
      setGeneralErrorModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneralErrorModal(true);
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
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: isCompact ? 16 : 24,
              paddingBottom: 24,
              paddingHorizontal: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-[380px] items-center">
              {/* Header Navigation Bar */}
              <View className="w-full h-11 flex-row items-center justify-between relative mb-6">
                <Pressable
                  onPress={handleBack}
                  hitSlop={12}
                  className="w-10 h-10 items-start justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ChevronLeft size={24} color="#414141" />
                </Pressable>

                {/* Progress Bar for Step 3 and 4 */}
                {(step === 'name' || step === 'birthday') && (
                  <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
                    <AccountCreationProgressBar
                      activeStep={step === 'name' ? 1 : 2}
                    />
                  </View>
                )}
                <View className="w-10" />
              </View>

              {/* --- SCREEN 1: Create your account (Email) --- */}
              {step === 'email' && (
                <View className="w-full">
                  <View className="w-full mb-6">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Create your account
                    </Text>
                  </View>

                  <View className="w-full gap-y-4">
                    <View className="w-full">
                      <FloatingInputField
                        label="Email address"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError(false);
                          if (emailErrorMessage) setEmailErrorMessage(null);
                        }}
                        hasError={emailError}
                        keyboardType="email-address"
                        clearable
                        returnKeyType="done"
                        inputRef={emailInputRef}
                        onSubmitEditing={handleNextEmail}
                      />

                      {emailErrorMessage && (
                        <Text className="text-xs font-sans text-destructive mt-1.5 ml-1">
                          {emailErrorMessage}
                        </Text>
                      )}
                    </View>

                    {/* Divider: or continue with */}
                    <View className="w-full flex-row items-center justify-between my-2">
                      <View className="flex-1 h-[1px] bg-border" />
                      <Text className="text-[13px] font-sans text-muted-foreground px-3">
                        or continue with
                      </Text>
                      <View className="flex-1 h-[1px] bg-border" />
                    </View>

                    {/* Google SSO Button */}
                    <Pressable
                      onPress={handleGooglePress}
                      className="w-full h-[50px] rounded-full bg-secondary flex-row items-center justify-center gap-2.5 active:opacity-85"
                      accessibilityRole="button"
                      accessibilityLabel="Sign up with Google"
                    >
                      <GoogleIcon size={18} />
                      <Text className="text-[15px] font-bold text-foreground">
                        Google
                      </Text>
                    </Pressable>

                    {/* Terms & Privacy Agreement Text */}
                    <Text className="text-xs font-sans text-muted-foreground text-left leading-relaxed mt-2">
                      By continuing, you agree with the{' '}
                      <Text
                        onPress={() => handleOpenPolicy('tos')}
                        className="text-primary font-bold"
                      >
                        Terms of Services
                      </Text>{' '}
                      and acknowledge the{' '}
                      <Text
                        onPress={() => handleOpenPolicy('privacy')}
                        className="text-primary font-bold"
                      >
                        Privacy Policy
                      </Text>{' '}
                      of SAGANA
                    </Text>
                  </View>
                </View>
              )}

              {/* --- SCREEN 2: Enter OTP --- */}
              {step === 'otp' && (
                <View className="w-full">
                  <View className="w-full gap-2 mb-6">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Enter one-time code
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      Kindly check your email for an OTP and enter it here.
                    </Text>
                  </View>

                  {/* 6 OTP Boxes */}
                  <View className="w-full mb-2">
                    <OtpInputGroup
                      code={otpCode}
                      onChangeCode={(c) => {
                        setOtpCode(c);
                        if (otpError) setOtpError(false);
                        if (otpErrorMessage) setOtpErrorMessage(null);
                        if (c.trim().length === 6) {
                          Keyboard.dismiss();
                        }
                      }}
                      hasError={otpError}
                    />

                    {otpErrorMessage && (
                      <Text className="text-xs font-sans text-destructive mt-2.5 ml-1 text-left">
                        {otpErrorMessage}
                      </Text>
                    )}
                  </View>

                  {/* Resend Link */}
                  <View className="w-full items-start mt-2">
                    <Pressable
                      onPress={handleResendOtp}
                      disabled={resendCooldown > 0}
                      className="py-1"
                    >
                      <Text className="text-[14px] font-medium text-foreground">
                        <Text className="text-[#96958F]">Didn’t receive any code? </Text>
                        <Text
                          className={cn(
                            'font-semibold',
                            resendCooldown > 0 ? 'text-[#96958F]' : 'text-primary'
                          )}
                        >
                          {resendCooldown > 0
                            ? `Resend after 00:${resendCooldown.toString().padStart(2, '0')}`
                            : 'Resend'}
                        </Text>
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* --- SCREEN 3: Who are you? (First Name & Last Name) --- */}
              {step === 'name' && (
                <View className="w-full">
                  <View className="w-full mb-6">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Who are you?
                    </Text>
                  </View>

                  <View className="w-full gap-y-3">
                    <FloatingInputField
                      label="First Name"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (nameError) setNameError(false);
                        if (nameErrorMessage) setNameErrorMessage(null);
                      }}
                      hasError={nameError}
                      autoCapitalize="words"
                      returnKeyType="next"
                      inputRef={firstNameRef}
                      onSubmitEditing={() => lastNameRef.current?.focus()}
                    />

                    <FloatingInputField
                      label="Last Name"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (nameError) setNameError(false);
                        if (nameErrorMessage) setNameErrorMessage(null);
                      }}
                      hasError={nameError}
                      autoCapitalize="words"
                      returnKeyType="done"
                      inputRef={lastNameRef}
                      onSubmitEditing={handleNextName}
                    />

                    {nameErrorMessage && (
                      <Text className="text-xs font-sans text-destructive mt-1 ml-1 text-left">
                        {nameErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* --- SCREEN 4: Who are you? (Birthday) --- */}
              {step === 'birthday' && (
                <View className="w-full">
                  <View className="w-full mb-6">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Who are you?
                    </Text>
                  </View>

                  <View className="w-full">
                    <SegmentedDateInput
                      month={birthMonth}
                      day={birthDay}
                      year={birthYear}
                      onChangeMonth={(val) => {
                        setBirthMonth(val);
                        if (birthdayError) setBirthdayError(false);
                        if (birthdayErrorMessage) setBirthdayErrorMessage(null);
                      }}
                      onChangeDay={(val) => {
                        setBirthDay(val);
                        if (birthdayError) setBirthdayError(false);
                        if (birthdayErrorMessage) setBirthdayErrorMessage(null);
                      }}
                      onChangeYear={(val) => {
                        setBirthYear(val);
                        if (birthdayError) setBirthdayError(false);
                        if (birthdayErrorMessage) setBirthdayErrorMessage(null);
                      }}
                      hasError={birthdayError}
                      onSubmitEditing={handleFinish}
                      monthRef={birthMonthRef}
                      dayRef={birthDayRef}
                      yearRef={birthYearRef}
                    />

                    {birthdayErrorMessage && (
                      <Text className="text-xs font-sans text-destructive mt-2 ml-1 text-left">
                        {birthdayErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Bottom Actions Container (Pinned at the bottom) */}
            <View className="w-full max-w-[380px] pt-6 pb-2">
              {step === 'email' && (
                <Pressable
                  onPress={handleNextEmail}
                  disabled={loading}
                  className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FAF9EE" size="small" />
                  ) : (
                    <Text className="text-[15px] font-bold text-primary-foreground">
                      Next
                    </Text>
                  )}
                </Pressable>
              )}

              {step === 'otp' && (
                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FAF9EE" size="small" />
                  ) : (
                    <Text className="text-[15px] font-bold text-primary-foreground">
                      Next
                    </Text>
                  )}
                </Pressable>
              )}

              {step === 'name' && (
                <Pressable
                  onPress={handleNextName}
                  className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90"
                  accessibilityRole="button"
                >
                  <Text className="text-[15px] font-bold text-primary-foreground">
                    Next
                  </Text>
                </Pressable>
              )}

              {step === 'birthday' && (
                <Pressable
                  onPress={handleFinish}
                  disabled={loading}
                  className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FAF9EE" size="small" />
                  ) : (
                    <Text className="text-[15px] font-bold text-primary-foreground">
                      Finish
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Terms of Service / Privacy Policy Gorhom Bottom Sheet Modal */}
      <PolicyBottomSheet
        ref={policySheetRef}
        type={policyType}
        onDismiss={handlePolicyDismiss}
      />

      {/* Duplicate Email Modal */}
      <ErrorModal
        visible={emailTakenModal}
        title="The email has been taken"
        description="Choose another email to use for creating your account."
        buttonText="Okay"
        onClose={() => setEmailTakenModal(false)}
      />

      {/* General Error Modal */}
      <ErrorModal
        visible={generalErrorModal}
        title="An error occurred"
        description="Try again later."
        buttonText="Okay"
        onClose={() => setGeneralErrorModal(false)}
      />
    </View>
  );
}
