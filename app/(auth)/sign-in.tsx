import { useState, useRef, useEffect, type RefObject } from 'react';
import {
  View,
  Text,
  Image,
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
import { Eye, EyeOff, X, CircleAlert } from 'lucide-react-native';
import { GoogleIcon } from '@/components/icons';
import { ErrorModal } from '@/components/ui/error-modal';
import { useAuthContext } from '@/context/auth-context';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const logger = createLogger('SignInScreen');

interface AuthInputFieldProps {
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

function AuthInputField({
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
}: AuthInputFieldProps) {
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

      {/* Trailing Icons */}
      <View className="flex-row items-center gap-1 -mr-1">
        {clearable && hasValue && isFocused && (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={8}
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel="Clear input"
          >
            <X size={16} color="#414141" />
          </Pressable>
        )}

        {isPassword && hasValue && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} color="#414141" />
            ) : (
              <Eye size={18} color="#414141" />
            )}
          </Pressable>
        )}

        {hasError && (
          <View className="p-1">
            <CircleAlert size={18} color="#E84C4C" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoaded } = useAuthContext();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmailAddress(text);
    if (emailError) setEmailError(false);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(false);
    if (errorMessage) setErrorMessage(null);
  };

  const handleLoginPress = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmedEmail = emailAddress.trim();
    const missingEmail = !trimmedEmail;
    const missingPassword = !password;

    if (missingEmail || missingPassword) {
      setEmailError(true);
      setPasswordError(true);
      setErrorMessage('Please enter your credentials');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(true);
      setPasswordError(true);
      setErrorMessage('Please enter a valid email address');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setEmailError(false);
    setPasswordError(false);
    setErrorMessage(null);

    try {
      if (isLoaded) {
        await signIn(trimmedEmail, password);
      }
    } catch (err: any) {
      logger.error('Login attempt failed', err);
      
      const errorCode = err?.errors?.[0]?.code;
      let message = 'Invalid email or password';
      
      if (errorCode === 'form_password_incorrect' || errorCode === 'form_identifier_not_found') {
        message = 'Incorrect credentials, try again';
      } else if (errorCode === 'too_many_requests') {
        message = 'Too many failed attempts, you may try again later';
      } else if (err?.errors?.[0]?.longMessage) {
        message = err.errors[0].longMessage;
      } else if (err?.message) {
        message = err.message;
      }

      setErrorMessage(message);
      setEmailError(true);
      setPasswordError(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      logger.error('Google Sign-In failed', err);
      const msg = err?.message || '';
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        setShowErrorModal(true);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPasswordPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/forgot-password');
  };

  const handleRequestAccountPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/sign-up');
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
            {/* Top Logo and Form Section */}
            <View className="w-full max-w-[380px] items-center pt-8">
              {/* Logo Area */}
              <View className="w-full items-center justify-center mb-10 mt-10">
                <Image
                  source={require('@/assets/sagana-wordmark-side.png')}
                  style={{ width: 300, height: 200 }}
                  resizeMode="contain"
                  accessibilityLabel="SAGANA Logo"
                />
              </View>

              {/* Form Area */}
              <View className="w-full">
                {/* Input Fields */}
                <View className="w-full gap-3">
                  <AuthInputField
                    label="Email address"
                    value={emailAddress}
                    onChangeText={handleEmailChange}
                    hasError={emailError}
                    keyboardType="email-address"
                    clearable
                    returnKeyType="next"
                    inputRef={emailInputRef}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />

                  <AuthInputField
                    label="Password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    hasError={passwordError}
                    isPassword
                    returnKeyType="done"
                    inputRef={passwordInputRef}
                    onSubmitEditing={handleLoginPress}
                  />
                </View>

                {/* Validation Error Message */}
                {errorMessage && (
                  <Text className="text-xs font-medium text-destructive mt-2 ml-1">
                    {errorMessage}
                  </Text>
                )}

                {/* Primary Action Button: Log in */}
                <Pressable
                  onPress={handleLoginPress}
                  disabled={loading || googleLoading}
                  className="w-full h-[50px] rounded-full bg-primary items-center justify-center mt-4 active:opacity-90 disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FAF9EE" size="small" />
                  ) : (
                    <Text className="text-[15px] font-bold text-primary-foreground">
                      Log in
                    </Text>
                  )}
                </Pressable>

                {/* Forgot Password Link */}
                <Pressable
                  onPress={handleForgotPasswordPress}
                  hitSlop={10}
                  className="py-1 items-center justify-center mt-4 mb-2"
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-bold text-primary text-center">
                    Forgot your password?
                  </Text>
                </Pressable>

                {/* Divider: or continue with */}
                <View className="w-full max-w-[350px] self-center flex-row items-center justify-between my-3">
                  <View className="flex-1 h-[1px] bg-border" />
                  <Text className="text-sm font-sans text-muted-foreground px-3">
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
                  accessibilityLabel="Sign in with Google"
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
              </View>
            </View>

            {/* Bottom Outline Button */}
            <View className="w-full max-w-[380px] pt-12 pb-10">
              <Pressable
                onPress={handleRequestAccountPress}
                disabled={loading || googleLoading}
                className="w-full h-[50px] rounded-full border-[1.5px] border-primary bg-transparent items-center justify-center active:opacity-80 disabled:opacity-60"
                accessibilityRole="button"
              >
                <Text className="text-[15px] font-bold text-primary">
                  Don’t have an account?
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <ErrorModal
        visible={showErrorModal}
        title="An error occured"
        description="Try again later."
        buttonText="Okay"
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  );
}
