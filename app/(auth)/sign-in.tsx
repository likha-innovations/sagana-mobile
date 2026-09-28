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
import { Eye, EyeOff, X } from 'lucide-react-native';
import { GoogleIcon } from '@/components/icons';
import { ErrorModal } from '@/components/ui/error-modal';
import { cn } from '@/lib/utils';

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

      {/* Trailing Icon */}
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
    </Pressable>
  );
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

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

  const handleLoginPress = () => {
    const trimmedEmail = emailAddress.trim();
    const missingEmail = !trimmedEmail;
    const missingPassword = !password;

    if (missingEmail || missingPassword) {
      setEmailError(missingEmail);
      setPasswordError(missingPassword);
      setErrorMessage('Please enter your credentials');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(true);
      setPasswordError(false);
      setErrorMessage('Please enter a valid email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setEmailError(false);
    setPasswordError(false);
    setErrorMessage(null);
  };

  const handleGooglePress = () => {
    setShowErrorModal(true);
  };

  const handleForgotPasswordPress = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleRequestAccountPress = () => {
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
              {/* Logo Area: larger visual glyphs, ample bottom margin to lower the form */}
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
                  className="w-full h-[45px] rounded-full bg-primary items-center justify-center mt-4 active:opacity-90"
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-bold text-primary-foreground">
                    Log in
                  </Text>
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
                  className="w-full h-[45px] rounded-full bg-secondary flex-row items-center justify-center gap-2.5 active:opacity-85"
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Google"
                >
                  <GoogleIcon size={18} />
                  <Text className="text-sm font-bold text-foreground">
                    Google
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Bottom Outline Button */}
            <View className="w-full max-w-[380px] pt-12 pb-10">
              <Pressable
                onPress={handleRequestAccountPress}
                className="w-full h-[45px] rounded-full border-[1.5px] border-primary bg-transparent items-center justify-center active:opacity-80"
                accessibilityRole="button"
              >
                <Text className="text-sm font-bold text-primary">
                  Don’t have an account?
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  );
}
