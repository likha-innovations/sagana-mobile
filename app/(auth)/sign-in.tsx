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
import { Mail, Lock } from 'lucide-react-native';
import * as toast from 'burnt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/auth-context';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { signIn, isLoaded } = useAuthContext();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    if (!emailAddress.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await signIn(emailAddress, password);
    } catch (err: any) {
      const errorMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to sign in. Please check your credentials.';

      setErrorMessage(errorMsg);

      if (Platform.OS !== 'web') {
        toast.toast({
          title: 'Sign In Failed',
          message: errorMsg,
          preset: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, emailAddress, password, signIn]);

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
              Welcome back
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1 px-4 leading-4">
              Sign in to monitor your IoT devices and manage your farm.
            </Text>
          </View>

          {errorMessage && (
            <View className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
              <Text className="text-xs font-medium text-red-600 text-center">
                {errorMessage}
              </Text>
            </View>
          )}

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

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              isPassword
              autoCapitalize="none"
              leadingIcon={<Lock size={18} color="#94a3b8" />}
            />

            <Link
              href="/(auth)/forgot-password"
              className="self-end text-xs font-semibold text-emerald-700 -mt-1.5 mb-3.5"
            >
              Forgot password?
            </Link>

            <Button
              title="Sign In"
              onPress={onSignInPress}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
