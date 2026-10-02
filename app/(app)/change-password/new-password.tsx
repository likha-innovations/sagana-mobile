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
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthContext } from '@/context/auth-context';
import { FloatingInputField, PasswordRequirements, ProgressBar } from '@/components/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChangePasswordNew');

export default function ChangePasswordNewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPassword = '' } = useLocalSearchParams<{ currentPassword: string }>();
  const { updatePassword } = useAuthContext();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleFinish = async () => {
    // Missing input check
    if (!newPassword || !confirmPassword) {
      if (!newPassword) setNewPasswordError(true);
      if (!confirmPassword) setConfirmPasswordError(true);
      setPasswordErrorMessage('Please enter and confirm your new password');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Password requirements check
    const isAtLeast12 = newPassword.length >= 12;
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!isAtLeast12 || !hasNumber || !hasSymbol) {
      setNewPasswordError(true);
      setConfirmPasswordError(false);
      setPasswordErrorMessage("Password doesn't meet requirements");
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Disallow new password matching current password
    if (currentPassword && newPassword === currentPassword) {
      setNewPasswordError(true);
      setConfirmPasswordError(false);
      setPasswordErrorMessage('New password must be different from current password');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Password mismatch check
    if (newPassword !== confirmPassword) {
      setNewPasswordError(false);
      setConfirmPasswordError(true);
      setPasswordErrorMessage("Passwords don't match");
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setNewPasswordError(false);
    setConfirmPasswordError(false);
    setPasswordErrorMessage(null);

    try {
      await updatePassword(currentPassword, newPassword);
      logger.info('Password successfully updated via Clerk');
      router.push('/change-password/success');
    } catch (err: unknown) {
      logger.error('Failed to change password', err);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const clerkErr = err as { errors?: Array<{ code?: string; message?: string; longMessage?: string }>; message?: string };
      const rawMessage =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        clerkErr?.message ||
        '';

      const isCurrentPasswordMismatch =
        clerkErr?.errors?.[0]?.code === 'form_password_incorrect' ||
        /current.*password/i.test(rawMessage) ||
        /incorrect.*password/i.test(rawMessage);

      if (isCurrentPasswordMismatch) {
        setPasswordErrorMessage('Current password is incorrect. Please tap back to re-enter it.');
      } else {
        setPasswordErrorMessage(rawMessage || 'Failed to update password. Please try again.');
      }
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
          <View className="flex-1 px-4 items-center justify-between pb-10">
            <View className="w-full max-w-[380px] items-center pt-4">
              {/* Header with back button and progress bar */}
              <View className="w-full h-11 flex-row items-center justify-between relative mb-6">
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  className="w-[30px] h-[30px] items-center justify-center -ml-1"
                  accessibilityRole="button"
                  accessibilityLabel="Back to Current Password"
                >
                  <ChevronLeft size={24} color="#414141" />
                </Pressable>

                <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
                  <ProgressBar activeStep={2} totalSteps={2} />
                </View>
                <View className="w-[30px]" />
              </View>

              {/* Title & Description */}
              <View className="w-full gap-2.5 mb-8 mt-2">
                <Text className="text-[20px] font-bold text-foreground text-left">
                  Enter new password
                </Text>
                <Text className="text-[14px] font-sans text-foreground text-left leading-5">
                  Enter and confirm the new password you wish to use for this account.
                </Text>
              </View>

              {/* Form fields */}
              <View className="w-full gap-3">
                <FloatingInputField
                  label="New password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) setNewPasswordError(false);
                    if (passwordErrorMessage) setPasswordErrorMessage(null);
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
                  }}
                  hasError={confirmPasswordError}
                  isPassword
                  returnKeyType="done"
                  inputRef={confirmPasswordRef}
                  onSubmitEditing={handleFinish}
                />

                {/* Inline Error Message */}
                {passwordErrorMessage && (
                  <Text className="text-[13px] font-sans text-destructive mt-1 ml-1 text-left">
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

            {/* Bottom Finish Button */}
            <View className="w-full max-w-[380px]">
              <Pressable
                onPress={handleFinish}
                disabled={loading || !newPassword || !confirmPassword}
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
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
