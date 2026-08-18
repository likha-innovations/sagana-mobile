import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Mail, Lock, KeyRound } from 'lucide-react-native';
import * as toast from 'burnt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/auth-context';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { requestPasswordReset, resetPassword, isLoaded } = useAuthContext();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onRequestReset = useCallback(async () => {
    if (!isLoaded) return;

    if (!emailAddress.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await requestPasswordReset(emailAddress.trim());
      setSuccessfulCreation(true);
    } catch (err: any) {
      const errorMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to send reset code.';

      setErrorMessage(errorMsg);

      if (Platform.OS !== 'web') {
        toast.toast({
          title: 'Reset Failed',
          message: errorMsg,
          preset: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, emailAddress, requestPasswordReset]);

  const onResetPassword = useCallback(async () => {
    if (!isLoaded) return;

    if (!code.trim() || !password) {
      setErrorMessage('Please enter the reset code and your new password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await resetPassword(code.trim(), password);
    } catch (err: any) {
      const errorMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to reset password.';

      setErrorMessage(errorMsg);

      if (Platform.OS !== 'web') {
        toast.toast({
          title: 'Reset Failed',
          message: errorMsg,
          preset: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, code, password, resetPassword]);

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Sagana Logo & Header */}
          <View className="w-full items-center mb-6 pt-2">
            <Image
              source={require('@/assets/sagana_wordmark.png')}
              style={{
                width: width - 48,
                height: 170,
              }}
              resizeMode="contain"
              accessibilityLabel="Sagana Hero Logo"
            />
            <Text className="text-lg font-bold text-slate-900 text-center tracking-tight mt-1">
              Reset Password
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1 px-4 leading-4">
              {!successfulCreation
                ? 'Enter your email address to receive a password reset code.'
                : `Enter the 6-digit code sent to ${emailAddress} and your new password.`}
            </Text>
          </View>

          {errorMessage && (
            <View className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
              <Text className="text-xs font-medium text-red-600 text-center">
                {errorMessage}
              </Text>
            </View>
          )}

          {!successfulCreation ? (
            <View className="w-full gap-1">
              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={emailAddress}
                onChangeText={(text) => {
                  setEmailAddress(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leadingIcon={<Mail size={18} color="#94a3b8" />}
              />

              <Button
                title="Send Reset Code"
                onPress={onRequestReset}
                loading={loading}
                className="mt-1"
              />

              <View className="flex-row justify-center items-center mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/(auth)/sign-in"
                  className="text-xs font-bold text-emerald-700"
                >
                  Back to Sign In
                </Link>
              </View>
            </View>
          ) : (
            <View className="w-full gap-1">
              <Input
                label="Verification Code"
                placeholder="123456"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                leadingIcon={<KeyRound size={18} color="#94a3b8" />}
              />

              <Input
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                isPassword
                autoCapitalize="none"
                leadingIcon={<Lock size={18} color="#94a3b8" />}
              />

              <Button
                title="Reset Password & Sign In"
                onPress={onResetPassword}
                loading={loading}
                className="mt-1"
              />

              <Button
                variant="ghost"
                title="Cancel / Back"
                onPress={() => {
                  setSuccessfulCreation(false);
                  setErrorMessage(null);
                }}
                className="mt-1"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
