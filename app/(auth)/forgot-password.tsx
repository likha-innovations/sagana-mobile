import { useState, useRef, useEffect, type RefObject } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
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

import { ProgressBar, FloatingInputField, OtpInputGroup, PasswordRequirements, ResendTimer } from '@/components/auth';

type FlowStep = 'email' | 'otp' | 'password' | 'success' | 'no_email_access';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; step?: FlowStep }>();
  const { requestPasswordReset, verifyPasswordResetCode, resetPassword, isLoaded } = useAuthContext();

  const [step, setStep] = useState<FlowStep>(params.step || 'email');

  // Step 1: Email Form State
  const [email, setEmail] = useState(params.email || '');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);

  // Step 2: OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(params.step === 'otp' ? 60 : 0);

  // Step 3: Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
  const [failedRequirements, setFailedRequirements] = useState<string[]>([]);

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
      if (params.step === 'otp') {
        router.replace('/(auth)/sign-in');
      } else {
        setStep('email');
      }
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
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    const trimmedCode = otpCode.trim();
    if (trimmedCode.length < 6) {
      setOtpError(true);
      setOtpErrorMessage('Incorrect one-time code');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setOtpError(false);
    setOtpErrorMessage(null);

    try {
      if (isLoaded) {
        await verifyPasswordResetCode(trimmedCode);
      }
      setStep('password');
    } catch (err: unknown) {
      setOtpError(true);
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
      const message =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        clerkErr?.message ||
        'Incorrect one-time code';
      setOtpErrorMessage(message);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: Finish Reset Password ---
  const handleFinishReset = async () => {
    // Figma validation 1: Missing input
    if (!newPassword || !confirmPassword) {
      if (!newPassword) setNewPasswordError(true);
      if (!confirmPassword) setConfirmPasswordError(true);
      setPasswordErrorMessage('Please enter and confirm your new password');
      setFailedRequirements([]);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Figma validation 2: Password requirements
    const isAtLeast12 = newPassword.length >= 12;
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!isAtLeast12 || !hasNumber || !hasSymbol) {
      const unmet = [];
      if (!isAtLeast12) unmet.push('At least 12+ characters');
      if (!hasNumber) unmet.push('Must have a number (0–9)');
      if (!hasSymbol) unmet.push('Must have a special symbol (e.g., !@#$)');

      setNewPasswordError(true);
      setConfirmPasswordError(false);
      setPasswordErrorMessage("Password doesn't meet requirements");
      setFailedRequirements(unmet);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Figma validation 3: Password mismatch
    if (newPassword !== confirmPassword) {
      setNewPasswordError(false);
      setConfirmPasswordError(true);
      setPasswordErrorMessage("Passwords doesn't match");
      setFailedRequirements([]);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setNewPasswordError(false);
    setConfirmPasswordError(false);
    setPasswordErrorMessage(null);
    setFailedRequirements([]);

    try {
      if (isLoaded) {
        await resetPassword(newPassword, otpCode.trim());
      }
      setStep('success');
    } catch (err: unknown) {
      setConfirmPasswordError(true);
      setNewPasswordError(true);
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
      const message =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        clerkErr?.message ||
        'Failed to reset password. The OTP may have expired.';
      setPasswordErrorMessage(message);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
            {/* Top Unified Group: Header + Form Content */}
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
                    <ProgressBar
                      activeStep={step === 'email' ? 1 : step === 'otp' ? 2 : 3}
                      totalSteps={3}
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
                        if (newPasswordError) setNewPasswordError(false);
                        if (passwordErrorMessage) setPasswordErrorMessage(null);
                        if (failedRequirements.length > 0) setFailedRequirements([]);
                      }}
                      hasError={newPasswordError}
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
                        if (confirmPasswordError) setConfirmPasswordError(false);
                        if (passwordErrorMessage) setPasswordErrorMessage(null);
                        if (failedRequirements.length > 0) setFailedRequirements([]);
                      }}
                      hasError={confirmPasswordError}
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

                    {/* Real-time Checklist Requirements */}
                    <PasswordRequirements
                      password={newPassword}
                      hasAttemptedSubmit={newPasswordError}
                    />
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
                  disabled={loading}
                  className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FAF9EE" size="small" />
                  ) : (
                    <Text className="text-[14px] font-bold text-primary-foreground">
                      Next
                    </Text>
                  )}
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
