import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthContext } from '@/context/auth-context';
import { OtpInputGroup, ResendTimer, ProgressBar } from '@/components/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChangePasswordOTP');

export default function ChangePasswordOtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clerkUser, user, requestPasswordReset, verifyPasswordResetCode } = useAuthContext();
  
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-send OTP on mount since we already know the email
  useEffect(() => {
    handleSendOtp();
  }, []);

  const handleSendOtp = async () => {
    if (!user?.email) return;
    try {
      // In Clerk, to change password via OTP without knowing the current password,
      // we must initiate a forgot password flow.
      await requestPasswordReset(user.email);
      logger.info('OTP requested for change password');
    } catch (err) {
      logger.error('Failed to send OTP', err);
      setOtpError(true);
      setOtpErrorMessage('Unable to send OTP. Please try again.');
    }
  };

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
      await verifyPasswordResetCode(trimmedCode);
      router.push({
        pathname: '/change-password/new-password',
        params: { code: trimmedCode },
      });
    } catch (err: unknown) {
      logger.error('Failed to verify OTP', err);
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

  // Auto-advance
  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerifyOtp();
    }
  }, [otpCode]);

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
            <View className="w-full max-w-[380px] items-center pt-4">
              <View className="w-full h-11 flex-row items-center justify-between relative mb-6">
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  className="w-[30px] h-[30px] items-center justify-center -ml-1"
                >
                  <ChevronLeft size={24} color="#414141" />
                </Pressable>

                <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
                  <ProgressBar activeStep={1} totalSteps={2} />
                </View>
                <View className="w-[30px]" />
              </View>

              <View className="w-full gap-2.5 mb-8 mt-2">
                <Text className="text-[20px] font-bold text-foreground text-left">
                  Enter one-time code
                </Text>
                <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                  Kindly check your email for an OTP and enter it here.
                </Text>
              </View>

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

              <ResendTimer onResend={handleSendOtp} cooldownSeconds={60} />
            </View>

            <View className="w-full max-w-[380px]">
              <Pressable
                onPress={handleVerifyOtp}
                disabled={loading || otpCode.length < 6}
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
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
