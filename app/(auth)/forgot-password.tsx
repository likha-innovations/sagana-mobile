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
  type TextInputProps,
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
import { ChevronLeft, Eye, EyeOff, CircleAlert } from 'lucide-react-native';
import { useAuthContext } from '@/context/auth-context';
import { cn } from '@/lib/utils';

// --- Figma Component: 3-Segment Progress Bar (144px x 6px) ---
function CompostingProgressBar({ activeStep }: { activeStep: 1 | 2 | 3 }) {
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
      <View
        className={cn(
          'flex-1 h-full rounded-[14px]',
          activeStep >= 3 ? 'bg-primary' : 'bg-[#C8C7BE]'
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
            ? 'border-foreground/50'
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

      {/* Trailing Icon */}
      {hasError && !isPassword && (
        <CircleAlert size={18} color="#E84C4C" />
      )}

      {isPassword && (
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
    </Pressable>
  );
}

// --- Figma Component: 6-Box OTP Input Field ---
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
    <View className="w-full flex-row justify-between items-center max-w-[380px]">
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
              'w-[52px] h-[61px] rounded-[14px] border-[1.5px] bg-background text-[24px] font-bold text-foreground',
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

type FlowStep = 'email' | 'otp' | 'password' | 'success' | 'no_email_access';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestPasswordReset, resetPassword, isLoaded } = useAuthContext();

  const [step, setStep] = useState<FlowStep>('email');

  // Step 1: Email Form State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);

  // Step 2: OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3: Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
  const [failedRequirement, setFailedRequirement] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Resend Countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Back Navigation Handler
  const handleBack = () => {
    if (step === 'email') {
      router.back();
    } else if (step === 'no_email_access') {
      setStep('email');
    } else if (step === 'otp') {
      setStep('email');
    } else if (step === 'password') {
      setStep('otp');
    } else if (step === 'success') {
      router.replace('/(auth)/sign-in');
    }
  };

  // --- Step 1: Submit Email ---
  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(true);
      setEmailErrorMessage('Please enter your email address');
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
        await requestPasswordReset(trimmed);
      }
      setResendCooldown(60);
      setStep('otp');
    } catch {
      setEmailError(true);
      setEmailErrorMessage('Unable to find account with this email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Resend OTP ---
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email.trim()) return;

    try {
      if (isLoaded) {
        await requestPasswordReset(email.trim());
      }
      setResendCooldown(60);
      setOtpError(false);
      setOtpErrorMessage(null);
    } catch {
      setOtpError(true);
      setOtpErrorMessage('Unable to resend OTP. Please try again.');
    }
  };

  // Auto-advance OTP when 6 digits entered
  useEffect(() => {
    if (step === 'otp' && otpCode.length === 6) {
      handleVerifyOtp();
    }
  }, [otpCode, step]);

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setOtpError(true);
      setOtpErrorMessage('Incorrect one-time code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setOtpError(false);
    setOtpErrorMessage(null);
    setStep('password');
  };

  // --- Step 3: Finish Reset Password ---
  const handleFinishReset = async () => {
    // Figma validation 1: Missing input
    if (!newPassword || !confirmPassword) {
      setPasswordError(true);
      setPasswordErrorMessage('Please enter and confirm your new password');
      setFailedRequirement(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Figma validation 2: Password requirements
    const isAtLeast12 = newPassword.length >= 12;
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!isAtLeast12 || !hasNumber || !hasSymbol) {
      setPasswordError(true);
      setPasswordErrorMessage('Password doesn’t meet requirements');
      if (!hasSymbol) {
        setFailedRequirement('Must have a special symbol (e.g., !@#$)');
      } else if (!hasNumber) {
        setFailedRequirement('Must have a number (0–9)');
      } else {
        setFailedRequirement('At least 12+ characters');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Figma validation 3: Password mismatch
    if (newPassword !== confirmPassword) {
      setPasswordError(true);
      setPasswordErrorMessage('Passwords doesn’t match');
      setFailedRequirement(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setPasswordError(false);
    setPasswordErrorMessage(null);
    setFailedRequirement(null);

    try {
      if (isLoaded) {
        await resetPassword(otpCode.trim(), newPassword);
      }
      setStep('success');
    } catch {
      setPasswordError(true);
      setPasswordErrorMessage('Failed to reset password. The OTP may have expired.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
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
            }}
            className="px-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Unified Group: Header + Form Content (Positioned at the upper section) */}
            <View className="w-full max-w-[380px] items-center pt-4">
              {/* Header Navigation Bar */}
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

                {/* Centered Progress Bar */}
                {step !== 'no_email_access' && step !== 'success' && (
                  <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
                    <CompostingProgressBar
                      activeStep={step === 'email' ? 1 : step === 'otp' ? 2 : 3}
                    />
                  </View>
                )}
                <View className="w-[30px]" />
              </View>

              {/* --- SCREEN 1: Enter Email Content --- */}
              {step === 'email' && (
                <View className="w-full">
                  <View className="w-full gap-2.5 mb-8">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Forgot your password?
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      To proceed, enter the email address registered under your account.
                    </Text>
                  </View>

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
                      returnKeyType="done"
                      inputRef={emailInputRef}
                      onSubmitEditing={handleSendOtp}
                    />

                    {emailErrorMessage && (
                      <Text className="text-[14px] font-sans text-destructive mt-2.5 ml-1">
                        {emailErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* --- SCREEN: No Email Access Content --- */}
              {step === 'no_email_access' && (
                <View className="w-full">
                  <View className="w-full h-[182px] bg-[#E2E1DC] rounded-[12px] mb-8 items-center justify-center">
                    <CircleAlert size={48} color="#718619" />
                  </View>

                  <View className="w-full gap-2.5">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Uh-oh, we’re sorry!
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      To recover your account, you must reach out to your admin for further instructions.
                    </Text>
                  </View>
                </View>
              )}

              {/* --- SCREEN 2: Enter OTP Content --- */}
              {step === 'otp' && (
                <View className="w-full">
                  <View className="w-full gap-2.5 mb-8">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Enter one-time code
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      Kindly check your email for an OTP and enter it here.
                    </Text>
                  </View>

                  {/* 6 OTP Boxes */}
                  <View className="w-full mb-3">
                    <OtpInputGroup
                      code={otpCode}
                      onChangeCode={(c) => {
                        setOtpCode(c);
                        if (otpError) setOtpError(false);
                        if (otpErrorMessage) setOtpErrorMessage(null);
                      }}
                      hasError={otpError}
                    />

                    {otpErrorMessage && (
                      <Text className="text-[14px] font-sans text-destructive mt-3 ml-1 text-left">
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

              {/* --- SCREEN 3: Enter New Password Content --- */}
              {step === 'password' && (
                <View className="w-full">
                  <View className="w-full gap-2.5 mb-8">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      Enter new password
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      Enter and confirm the new password you wish to use for this account.
                    </Text>
                  </View>

                  <View className="w-full gap-3">
                    <FloatingInputField
                      label="New password"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (passwordError) setPasswordError(false);
                        if (passwordErrorMessage) setPasswordErrorMessage(null);
                        if (failedRequirement) setFailedRequirement(null);
                      }}
                      hasError={passwordError}
                      isPassword
                      returnKeyType="next"
                      inputRef={newPasswordRef}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    />

                    <FloatingInputField
                      label="Confirm new password"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (passwordError) setPasswordError(false);
                        if (passwordErrorMessage) setPasswordErrorMessage(null);
                        if (failedRequirement) setFailedRequirement(null);
                      }}
                      hasError={passwordError}
                      isPassword
                      returnKeyType="done"
                      inputRef={confirmPasswordRef}
                      onSubmitEditing={handleFinishReset}
                    />

                    {/* Inline Error Message */}
                    {passwordErrorMessage && (
                      <Text className="text-[14px] font-sans text-destructive mt-1 ml-1 text-left">
                        {passwordErrorMessage}
                      </Text>
                    )}

                    {/* Specific Failed Requirement Bullet */}
                    {failedRequirement && (
                      <Text className="text-[13px] font-sans text-destructive -mt-1 ml-4 text-left">
                        • {failedRequirement}
                      </Text>
                    )}

                    {/* Checklist Requirements matching Figma */}
                    {!passwordErrorMessage && (
                      <View className="w-full mt-2 pl-2">
                        <Text className="text-[13px] font-sans text-[#96958F] leading-6">
                          • At least 12+ characters
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

              {/* --- SCREEN 4: Success Content --- */}
              {step === 'success' && (
                <View className="w-full">
                  <View className="w-full h-[182px] bg-[#E2E1DC] rounded-[12px] mb-8 items-center justify-center">
                    <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white text-2xl font-bold">✓</Text>
                    </View>
                  </View>

                  <View className="w-full gap-2.5">
                    <Text className="text-[20px] font-bold text-foreground text-left">
                      You are all set!
                    </Text>
                    <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                      You can now login to your account using your new password.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bottom Actions Container (Pinned at the bottom) */}
            <View className="w-full max-w-[380px] pb-10">
              {step === 'email' && (
                <View className="w-full gap-3">
                  <Pressable
                    onPress={handleSendOtp}
                    disabled={loading}
                    className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
                    accessibilityRole="button"
                  >
                    {loading ? (
                      <ActivityIndicator color="#FAF9EE" size="small" />
                    ) : (
                      <Text className="text-[14px] font-bold text-primary-foreground">
                        Send OTP
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setStep('no_email_access')}
                    className="w-full h-[45px] rounded-full border-[1.5px] border-primary bg-transparent items-center justify-center active:opacity-80"
                    accessibilityRole="button"
                  >
                    <Text className="text-[14px] font-bold text-primary">
                      I forgot my email address
                    </Text>
                  </Pressable>
                </View>
              )}

              {step === 'no_email_access' && (
                <Pressable
                  onPress={() => router.replace('/(auth)/sign-in')}
                  className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90"
                  accessibilityRole="button"
                >
                  <Text className="text-[14px] font-bold text-primary-foreground">
                    Got it, go back to log in
                  </Text>
                </Pressable>
              )}

              {step === 'otp' && (
                <Pressable
                  onPress={handleVerifyOtp}
                  className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90"
                  accessibilityRole="button"
                >
                  <Text className="text-[14px] font-bold text-primary-foreground">
                    Next
                  </Text>
                </Pressable>
              )}

              {step === 'password' && (
                <Pressable
                  onPress={handleFinishReset}
                  disabled={loading}
                  className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FAF9EE" size="small" />
                  ) : (
                    <Text className="text-[14px] font-bold text-primary-foreground">
                      Finish
                    </Text>
                  )}
                </Pressable>
              )}

              {step === 'success' && (
                <Pressable
                  onPress={() => router.replace('/(auth)/sign-in')}
                  className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90"
                  accessibilityRole="button"
                >
                  <Text className="text-[14px] font-bold text-primary-foreground">
                    Go to Log In
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
