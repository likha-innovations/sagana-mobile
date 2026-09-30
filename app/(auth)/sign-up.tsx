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
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ChevronLeft, Eye, EyeOff, X } from 'lucide-react-native';
import { GoogleIcon } from '@/components/icons';
import { ErrorModal } from '@/components/ui/error-modal';
import { PolicyBottomSheet } from '@/components/auth';
import { useAuthContext } from '@/context/auth-context';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const logger = createLogger('SignUpScreen');

const MOCK_BARANGAYS = [
  'Barangay 1',
  'Barangay 2',
  'Barangay 3',
  'Barangay 4',
  'Barangay 5',
];

// --- Figma Component: 2-Segment Expanding Step Indicator for Account Creation ---
function AccountCreationProgressBar({ activeStep }: { activeStep: 1 | 2 }) {
  return (
    <View className="flex-row items-center gap-2 h-[5px]">
      <View
        className={cn(
          'h-[5px] rounded-full bg-primary',
          activeStep === 1 ? 'w-[84px]' : 'w-[18px]'
        )}
      />
      <View
        className={cn(
          'h-[5px] rounded-full',
          activeStep === 2
            ? 'w-[84px] bg-primary'
            : 'w-[18px] bg-[#C8C7BE]'
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
  placeholder?: string;
  isPassword?: boolean;
  clearable?: boolean;
  hasError?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: RefObject<TextInput | null>;
  trailingIcon?: React.ReactNode;
  onTrailingPress?: () => void;
}

function FloatingInputField({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  clearable = false,
  hasError = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  inputRef,
  trailingIcon,
  onTrailingPress,
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
          placeholder={isFloating ? placeholder : undefined}
          placeholderTextColor="#96958F"
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

      {trailingIcon && (!clearable || !hasValue || !isFocused) && (
        <Pressable
          onPress={onTrailingPress}
          hitSlop={8}
          className="p-1 -mr-1"
          accessibilityRole="button"
        >
          {trailingIcon}
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









type SignUpStep = 'email' | 'otp' | 'password' | 'name' | 'location';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const isCompact = screenHeight < 720;
  const {
    signUp,
    verifyEmail,
    completeSignUp,
    signInWithGoogle,
    isLoaded,
    isSignedIn,
    clerkUser,
    user,
    signOut,
  } = useAuthContext();

  const [step, setStep] = useState<SignUpStep>('email');

  // Step 1: Email Form State
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  const emailInputRef = useRef<TextInput>(null);

  // Step 2: OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(59);

  // Step 3: Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
  const [failedRequirements, setFailedRequirements] = useState<string[]>([]);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Step 3: Name State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState<string | null>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  // Step 4: Birthday & Barangay State
  const [birthdayInput, setBirthdayInput] = useState('');
  const [birthdayError, setBirthdayError] = useState(false);
  const [birthdayErrorMessage, setBirthdayErrorMessage] = useState<string | null>(null);
  const birthdayInputRef = useRef<TextInput>(null);

  const [barangay, setBarangay] = useState('');
  const [barangayError, setBarangayError] = useState(false);
  const [barangayErrorMessage, setBarangayErrorMessage] = useState<string | null>(null);
  const barangaySheetRef = useRef<BottomSheetModal>(null);

  // Modals
  const [loading, setLoading] = useState(false);
  const policySheetRef = useRef<BottomSheetModal>(null);
  const [policyType, setPolicyType] = useState<'tos' | 'privacy' | null>(null);
  const [emailTakenModal, setEmailTakenModal] = useState(false);
  const [generalErrorModal, setGeneralErrorModal] = useState(false);

  // Prefill Google SSO user names and advance to 'name' step if birthday is not yet set
  useEffect(() => {
    if (isSignedIn && clerkUser && !user?.birthday) {
      const gFirst =
        clerkUser.firstName ||
        (clerkUser.fullName ? clerkUser.fullName.split(' ')[0] : '') ||
        '';
      const gLast =
        clerkUser.lastName ||
        (clerkUser.fullName ? clerkUser.fullName.split(' ').slice(1).join(' ') : '') ||
        '';

      if (gFirst) {
        setFirstName((prev) => (prev ? prev : gFirst));
      }
      if (gLast) {
        setLastName((prev) => (prev ? prev : gLast));
      }

      setStep('name');
    }
  }, [isSignedIn, clerkUser, user?.birthday]);

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

  const handleBack = async () => {
    if (step === 'location') {
      setStep('name');
    } else if (step === 'name') {
      if (isSignedIn) {
        try {
          await signOut();
        } catch (e) {
          logger.warn('Sign out on back press notice', e);
        }
        setStep('email');
      } else {
        setStep('password');
      }
    } else if (step === 'password') {
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
      setStep('password');
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

  // --- Step 3: Validate Password ---
  const handleNextPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!password || !confirmPassword) {
      if (!password) setPasswordError(true);
      if (!confirmPassword) setConfirmPasswordError(true);
      setPasswordErrorMessage('Please enter and confirm your password');
      setFailedRequirements([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const isAtLeast8 = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!isAtLeast8 || !hasNumber || !hasSymbol) {
      const unmet = [];
      if (!isAtLeast8) unmet.push('At least 8+ characters');
      if (!hasNumber) unmet.push('Must have a number (0–9)');
      if (!hasSymbol) unmet.push('Must have a special symbol (e.g., !@#$)');

      setPasswordError(true);
      setConfirmPasswordError(false);
      setPasswordErrorMessage("Password doesn't meet requirements");
      setFailedRequirements(unmet);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(false);
      setConfirmPasswordError(true);
      setPasswordErrorMessage("Passwords doesn't match");
      setFailedRequirements([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setPasswordError(false);
    setConfirmPasswordError(false);
    setPasswordErrorMessage(null);
    setFailedRequirements([]);
    setStep('name');
  };

  // --- Step 4: Validate Name & Birthday ---
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

    const digits = birthdayInput.replace(/\D/g, '');
    if (digits.length < 8) {
      setNameError(false);
      setNameErrorMessage(null);
      setBirthdayError(true);
      setBirthdayErrorMessage('Please enter your complete date of birth (MM / DD / YYYY)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const monthNum = parseInt(digits.slice(0, 2), 10);
    const dayNum = parseInt(digits.slice(2, 4), 10);
    const yearNum = parseInt(digits.slice(4, 8), 10);
    const currentYear = new Date().getFullYear();

    if (monthNum < 1 || monthNum > 12) {
      setBirthdayError(true);
      setBirthdayErrorMessage('Please enter a valid month (01–12)');
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

    if (yearNum < 1920 || yearNum > currentYear - 5) {
      setBirthdayError(true);
      setBirthdayErrorMessage('Please enter a valid birth year');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setNameError(false);
    setNameErrorMessage(null);
    setBirthdayError(false);
    setBirthdayErrorMessage(null);
    setStep('location');
  };

  const handleBirthdayChange = (text: string) => {
    if (birthdayError) setBirthdayError(false);
    if (birthdayErrorMessage) setBirthdayErrorMessage(null);

    // If user hit backspace on " / "
    if (text.length < birthdayInput.length) {
      if (text.endsWith(' / ') || text.endsWith('/')) {
        setBirthdayInput(text.slice(0, -3).trim());
        return;
      }
      setBirthdayInput(text);
      return;
    }

    const clean = text.replace(/\D/g, '').slice(0, 8);
    let formatted = clean;

    if (clean.length > 4) {
      formatted = `${clean.slice(0, 2)} / ${clean.slice(2, 4)} / ${clean.slice(4)}`;
    } else if (clean.length > 2) {
      formatted = `${clean.slice(0, 2)} / ${clean.slice(2)}`;
    }

    setBirthdayInput(formatted);
  };


  // --- Step 5: Finish Registration ---
  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let hasErr = false;

    if (!barangay) {
      setBarangayError(true);
      setBarangayErrorMessage('Please select your barangay');
      hasErr = true;
    } else {
      setBarangayError(false);
      setBarangayErrorMessage(null);
    }

    if (hasErr) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const digits = birthdayInput.replace(/\D/g, '');
    const formattedBirthday = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    setLoading(true);

    try {
      if (isLoaded) {
        await completeSignUp(firstName, lastName, formattedBirthday, barangay, password || undefined);
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

  const handleGooglePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.isNewUserOrIncomplete) {
        if (result.firstName) setFirstName(result.firstName);
        if (result.lastName) setLastName(result.lastName);
        setStep('name');
      }
    } catch (err: any) {
      logger.error('Google Sign-Up failed', err);
      const msg = err?.message || '';
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        setGeneralErrorModal(true);
      }
    } finally {
      setGoogleLoading(false);
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
                {(step === 'name' || step === 'location') && (
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
                      disabled={loading || googleLoading}
                      className="w-full h-[50px] rounded-full bg-secondary flex-row items-center justify-center gap-2.5 active:opacity-85 disabled:opacity-60"
                      accessibilityRole="button"
                      accessibilityLabel="Sign up with Google"
                    >
                      {googleLoading ? (
                        <ActivityIndicator color="#414141" size="small" />
                      ) : (
                        <>
                          <GoogleIcon size={18} />
                          <Text className="text-[15px] font-bold text-foreground">
                            Google
                          </Text>
                        </>
                      )}
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

              {/* --- SCREEN 3: Enter Password Content --- */}
              {step === 'password' && (
                <View className="w-full">
                  <View className="w-full gap-2.5 mb-8">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Enter new password
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      Enter and confirm the password you wish to use for this account.
                    </Text>
                  </View>

                  <View className="w-full gap-3">
                    <FloatingInputField
                      label="New password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError(false);
                        if (passwordErrorMessage) setPasswordErrorMessage(null);
                        if (failedRequirements.length > 0) setFailedRequirements([]);
                      }}
                      hasError={passwordError}
                      isPassword
                      returnKeyType="next"
                      inputRef={passwordRef}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    />

                    <FloatingInputField
                      label="Confirm new password"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (confirmPasswordError) setConfirmPasswordError(false);
                        if (passwordErrorMessage) setPasswordErrorMessage(null);
                        if (failedRequirements.length > 0) setFailedRequirements([]);
                      }}
                      hasError={confirmPasswordError}
                      isPassword
                      returnKeyType="done"
                      inputRef={confirmPasswordRef}
                      onSubmitEditing={handleNextPassword}
                    />

                    {/* Inline Error Message */}
                    {passwordErrorMessage && (
                      <Text className="text-[14px] font-sans text-destructive mt-1 ml-1 text-left">
                        {passwordErrorMessage}
                      </Text>
                    )}

                    {/* Specific Failed Requirement Bullets */}
                    {failedRequirements.length > 0 && (
                      <View className="w-full mt-1 pl-2">
                        {failedRequirements.map((req, idx) => (
                          <Text key={idx} className="text-[13px] font-sans text-destructive leading-6">
                            • {req}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Checklist Requirements matching Figma */}
                    {!passwordErrorMessage && (
                      <View className="w-full mt-2 pl-2">
                        <Text className="text-[13px] font-sans text-[#96958F] leading-6">
                          • At least 8+ characters
                        </Text>
                        <Text className="text-[13px] font-sans text-[#96958F] leading-6">
                          • Must have a number (0–9)
                        </Text>
                        <Text className="text-[13px] font-sans text-[#96958F] leading-6">
                          • Must have a special symbol (e.g., !@#$)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* --- SCREEN 4: Who are you? (First Name, Last Name & Birthday) --- */}
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
                      clearable
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
                      clearable
                      hasError={nameError}
                      autoCapitalize="words"
                      returnKeyType="next"
                      inputRef={lastNameRef}
                      onSubmitEditing={() => birthdayInputRef.current?.focus()}
                    />

                    {nameErrorMessage && (
                      <Text className="text-xs font-sans text-destructive mt-0.5 ml-1 text-left">
                        {nameErrorMessage}
                      </Text>
                    )}

                    <FloatingInputField
                      label="Birthday"
                      placeholder="MM / DD / YYYY"
                      value={birthdayInput}
                      onChangeText={handleBirthdayChange}
                      hasError={birthdayError}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      inputRef={birthdayInputRef}
                      onSubmitEditing={handleNextName}
                      clearable
                    />

                    {birthdayErrorMessage && (
                      <Text className="text-xs font-sans text-destructive mt-0.5 ml-1 text-left">
                        {birthdayErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* --- SCREEN 5: Location (Barangay) --- */}
              {step === 'location' && (
                <View className="w-full">
                  <View className="w-full mb-6">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Where are you from?
                    </Text>
                  </View>

                  <View className="w-full gap-y-4">
                    <View className="w-full">
                      <Pressable
                        onPress={() => {
                          Keyboard.dismiss();
                          barangaySheetRef.current?.present();
                        }}
                      >
                        <View pointerEvents="none">
                          <FloatingInputField
                            label="Barangay"
                            value={barangay}
                            onChangeText={() => {}}
                            hasError={barangayError}
                          />
                        </View>
                      </Pressable>

                      {barangayErrorMessage && (
                        <Text className="text-xs font-sans text-destructive mt-1.5 ml-1 text-left">
                          {barangayErrorMessage}
                        </Text>
                      )}
                    </View>
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

              {step === 'password' && (
                <Pressable
                  onPress={handleNextPassword}
                  className="w-full h-[50px] rounded-full bg-primary items-center justify-center active:opacity-90"
                  accessibilityRole="button"
                >
                  <Text className="text-[15px] font-bold text-primary-foreground">
                    Next
                  </Text>
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

              {step === 'location' && (
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

      {/* Barangay Selection Bottom Sheet Modal */}
      <BottomSheetModal
        ref={barangaySheetRef}
        snapPoints={['50%']}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
        backgroundStyle={{ backgroundColor: '#FAF9EE' }}
        handleIndicatorStyle={{ backgroundColor: '#C8C7BE', width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          className="flex-1 pt-2"
        >
          {MOCK_BARANGAYS.map((brgy) => {
            const isSelected = barangay === brgy;
            return (
              <Pressable
                key={brgy}
                onPress={() => {
                  setBarangay(brgy);
                  setBarangayError(false);
                  setBarangayErrorMessage(null);
                  barangaySheetRef.current?.dismiss();
                }}
                className={cn(
                  'py-3.5 px-6 w-full flex-row items-center',
                  isSelected ? 'bg-[#EAE8DD]' : 'bg-transparent active:bg-secondary/20'
                )}
              >
                <Text className="text-[14px] font-sans text-foreground">{brgy}</Text>
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>

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
