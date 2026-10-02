import { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { FloatingInputField, ProgressBar } from '@/components/auth';
import { useAuthContext } from '@/context/auth-context';

import { useSession } from '@clerk/expo';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CurrentPasswordScreen');

export default function CurrentPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { user, clerkUser, signOut, requestPasswordReset } = useAuthContext();

  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [currentPasswordErrorMessage, setCurrentPasswordErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const userEmail = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';

  const inputRef = useRef<TextInput>(null);

  const handleNext = async () => {
    const trimmed = currentPassword.trim();
    if (!trimmed) {
      setCurrentPasswordError(true);
      setCurrentPasswordErrorMessage('Please enter your current password');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setCurrentPasswordError(false);
    setCurrentPasswordErrorMessage(null);

    try {
      if (session) {
        await session.startVerification({ level: 'first_factor' });
        await session.attemptFirstFactorVerification({
          strategy: 'password',
          password: trimmed,
        });
      }

      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/change-password/new-password',
        params: { currentPassword: trimmed },
      });
    } catch (err: unknown) {
      logger.error('Failed to verify current password', err);
      setCurrentPasswordError(true);
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
      const rawMessage =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        clerkErr?.message ||
        '';

      const isMismatch =
        /incorrect/i.test(rawMessage) ||
        /password/i.test(rawMessage) ||
        /invalid/i.test(rawMessage);

      setCurrentPasswordErrorMessage(
        isMismatch ? 'Current password is incorrect' : (rawMessage || 'Current password is incorrect')
      );
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedForgotPassword = async () => {
    if (!userEmail) return;

    setForgotLoading(true);
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const emailToReset = userEmail;

      // Invalidate current session to enable Clerk unauthenticated reset flow
      await signOut();

      // Trigger password reset OTP email
      await requestPasswordReset(emailToReset);

      // Redirect directly to the OTP step in forgot-password screen
      router.replace({
        pathname: '/(auth)/forgot-password',
        params: { email: emailToReset, step: 'otp' },
      });
    } catch (err: unknown) {
      logger.error('Failed to trigger forgot password flow', err);
      router.replace({
        pathname: '/(auth)/forgot-password',
        params: { email: userEmail, step: 'email' },
      });
    } finally {
      setForgotLoading(false);
      setIsForgotModalVisible(false);
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
            <View className="w-full max-w-[380px] items-center pt-4">
              {/* Header with back button and progress bar */}
              <View className="w-full h-11 flex-row items-center justify-between relative mb-6">
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  className="w-[30px] h-[30px] items-center justify-center -ml-1"
                  accessibilityRole="button"
                  accessibilityLabel="Back to Profile"
                >
                  <ChevronLeft size={24} color="#414141" />
                </Pressable>

                <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
                  <ProgressBar activeStep={1} totalSteps={2} />
                </View>
                <View className="w-[30px]" />
              </View>

              {/* Title & Description */}
              <View className="w-full gap-2.5 mb-8 mt-2">
                <Text className="text-[20px] font-bold text-foreground text-left">
                  Enter current password
                </Text>
                <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                  To protect your account, please enter your current password.
                </Text>
              </View>

              {/* Input field */}
              <View className="w-full gap-1">
                <FloatingInputField
                  label="Current password"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (currentPasswordError) setCurrentPasswordError(false);
                    if (currentPasswordErrorMessage) setCurrentPasswordErrorMessage(null);
                  }}
                  hasError={currentPasswordError}
                  isPassword
                  returnKeyType="next"
                  inputRef={inputRef}
                  onSubmitEditing={handleNext}
                />

                {currentPasswordErrorMessage && (
                  <Text className="text-[13px] font-sans text-destructive mt-1 ml-1 text-left">
                    {currentPasswordErrorMessage}
                  </Text>
                )}

                {/* Forgot Password Link */}
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsForgotModalVisible(true);
                  }}
                  hitSlop={10}
                  className="self-end mt-2"
                >
                  <Text className="text-[13px] font-sans text-primary">
                    Forgot password?
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Bottom Next Button */}
            <View className="w-full max-w-[380px]">
              <Pressable
                onPress={handleNext}
                disabled={loading || !currentPassword.trim()}
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

      {/* Forgot Password Confirmation Modal */}
      <Modal
        visible={isForgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!forgotLoading) setIsForgotModalVisible(false);
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full max-w-[340px] bg-card border border-border rounded-[14px] p-6 gap-5 shadow-lg">
            <View className="gap-2 items-center">
              <Text className="text-[18px] font-bold text-foreground text-center">
                Forgot password?
              </Text>
              <Text className="text-[13px] font-sans text-muted-foreground text-center leading-5">
                To reset your password using an email verification code, your current session will end and an OTP will be sent to:
              </Text>
              <Text className="text-[14px] font-bold text-foreground text-center mt-1">
                {userEmail}
              </Text>
              <Text className="text-[13px] font-sans text-muted-foreground text-center leading-5 mt-1">
                Do you want to proceed?
              </Text>
            </View>

            <View className="flex-row items-center gap-3 mt-1">
              <Pressable
                onPress={() => setIsForgotModalVisible(false)}
                disabled={forgotLoading}
                className="flex-1 h-[42px] rounded-full bg-secondary items-center justify-center active:opacity-80"
              >
                <Text className="text-[14px] font-bold text-foreground">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleProceedForgotPassword}
                disabled={forgotLoading}
                className="flex-1 h-[42px] rounded-full bg-primary items-center justify-center active:opacity-90 disabled:opacity-60"
              >
                {forgotLoading ? (
                  <ActivityIndicator color="#FAF9EE" size="small" />
                ) : (
                  <Text className="text-[14px] font-bold text-primary-foreground">
                    Continue
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
