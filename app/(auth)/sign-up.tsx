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
import { Mail, Lock, User, Phone, MapPin, KeyRound } from 'lucide-react-native';
import * as toast from 'burnt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/icons';
import { useAuthContext } from '@/context/auth-context';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { signUp, verifyEmail, signInWithGoogle, isOAuthLoading, isLoaded } = useAuthContext();

  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSignUpPress = useCallback(async () => {
    if (!isLoaded) return;

    if (!fullName.trim() || !emailAddress.trim() || !password) {
      setErrorMessage('Please fill in your full name, email, and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await signUp({
        fullName: fullName.trim(),
        email: emailAddress.trim(),
        password,
        contactNumber: contactNumber.trim() || undefined,
        location: location.trim() || undefined,
      });

      setPendingVerification(true);
    } catch (err: any) {
      const errorMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to create account. Please try again.';

      setErrorMessage(errorMsg);

      if (Platform.OS !== 'web') {
        toast.toast({
          title: 'Sign Up Failed',
          message: errorMsg,
          preset: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, fullName, emailAddress, contactNumber, location, password, signUp]);

  const onVerifyPress = useCallback(async () => {
    if (!isLoaded) return;

    if (!code.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await verifyEmail(code.trim());
    } catch (err: any) {
      const errorMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid verification code.';

      setErrorMessage(errorMsg);

      if (Platform.OS !== 'web') {
        toast.toast({
          title: 'Verification Failed',
          message: errorMsg,
          preset: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, code, verifyEmail]);

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
          {!pendingVerification ? (
            <>
              <View className="w-full items-center mb-6 pt-2">
                <Image
                  source={require('@/assets/sagana_combination_mark.png')}
                  style={{
                    width: width - 48,
                    height: 170,
                  }}
                  resizeMode="contain"
                  accessibilityLabel="Sagana Hero Logo"
                />
                <Text className="text-lg font-bold text-slate-900 text-center tracking-tight mt-1">
                  Create your account
                </Text>
                <Text className="text-xs text-slate-500 text-center mt-1 px-4 leading-4">
                  Join Sagana to start monitoring your IoT devices and farms.
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
                  label="Full Name"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  leadingIcon={<User size={18} color="#94a3b8" />}
                />

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
                  label="Contact Number (Optional)"
                  placeholder="+63 912 345 6789"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                  leadingIcon={<Phone size={18} color="#94a3b8" />}
                />

                <Input
                  label="Farm / Location (Optional)"
                  placeholder="e.g. Bukidnon, Philippines"
                  value={location}
                  onChangeText={setLocation}
                  leadingIcon={<MapPin size={18} color="#94a3b8" />}
                />

                <Input
                  label="Password"
                  placeholder="Create a strong password"
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
                  title="Create Account"
                  onPress={onSignUpPress}
                  loading={loading}
                  className="mt-1"
                />

                {/* Social Divider & Google SSO */}
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-[1px] bg-slate-200" />
                  <Text className="text-xs text-slate-400 px-4 font-semibold uppercase tracking-wider">
                    Or continue with
                  </Text>
                  <View className="flex-1 h-[1px] bg-slate-200" />
                </View>

                <Button
                  variant="outline"
                  onPress={signInWithGoogle}
                  loading={isOAuthLoading}
                  className="w-full flex-row items-center gap-3 border-slate-200 bg-white shadow-none"
                >
                  <GoogleIcon size={18} />
                  <Text className="text-sm font-semibold text-slate-800">
                    Continue with Google
                  </Text>
                </Button>

                <View className="flex-row justify-center items-center gap-1.5 mt-6 pt-4 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">
                    Already have an account?
                  </Text>
                  <Link
                    href="/(auth)/sign-in"
                    className="text-xs font-bold text-emerald-700"
                  >
                    Sign In
                  </Link>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Verification Header */}
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
                  Verify your email
                </Text>
                <Text className="text-xs text-slate-500 text-center mt-1 px-4 leading-4">
                  We sent a 6-digit verification code to {emailAddress}
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

                <Button
                  title="Verify & Continue"
                  onPress={onVerifyPress}
                  loading={loading}
                  className="mt-1"
                />

                <Button
                  variant="ghost"
                  title="Change Email / Back"
                  onPress={() => {
                    setPendingVerification(false);
                    setErrorMessage(null);
                  }}
                  className="mt-1"
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
