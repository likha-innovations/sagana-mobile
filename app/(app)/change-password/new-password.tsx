import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CircleAlert } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function NewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValidLength = newPassword.length >= 12;
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isFormValid = isValidLength && hasNumber && hasSpecial && passwordsMatch;

  const handleFinish = () => {
    if (isFormValid) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace('/change-password/success');
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 64 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Bar */}
            <View className="flex-row items-center h-11 w-full relative mb-8">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-8 h-8 justify-center z-10"
              >
                <ChevronLeft size={30} color="#414141" />
              </TouchableOpacity>
              
              <View className="absolute w-full flex-row justify-center items-center pointer-events-none">
                <View className="flex-row items-center w-[144px] h-[6px] gap-2.5">
                  <View className="flex-1 h-full bg-primary rounded-[14px]" />
                  <View className="flex-1 h-full bg-primary rounded-[14px]" />
                </View>
              </View>
            </View>

            {/* Content */}
            <View className="gap-8 flex-1">
              <View className="gap-2.5">
                <Text className="text-[20px] font-bold text-foreground">
                  Enter new password
                </Text>
                <Text className="text-[14px] text-foreground font-sans">
                  Enter and confirm the new password you wish to use for this account.
                </Text>
              </View>

              <View className="gap-4 w-full">
                {/* New Password Input */}
                <View 
                  className={`flex-row items-center h-[58px] px-[15px] bg-card rounded-[14px] border-[1.5px] ${
                    newPassword && !isValidLength ? 'border-destructive' : 'border-border'
                  }`}
                >
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor="#96958F"
                    secureTextEntry
                    className="flex-1 text-[13px] font-sans text-foreground h-full"
                  />
                  {newPassword && !isValidLength && <CircleAlert size={20} color="#E84C4C" />}
                </View>

                {/* Confirm Password Input */}
                <View 
                  className={`flex-row items-center h-[58px] px-[15px] bg-card rounded-[14px] border-[1.5px] ${
                    confirmPassword && !passwordsMatch ? 'border-destructive' : 'border-border'
                  }`}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#96958F"
                    secureTextEntry
                    className="flex-1 text-[13px] font-sans text-foreground h-full"
                  />
                  {confirmPassword && !passwordsMatch && <CircleAlert size={20} color="#E84C4C" />}
                </View>

                {/* Rules List */}
                <View className="mt-2 pl-2">
                  <Text className={`text-[14px] font-sans ${isValidLength ? 'text-primary' : 'text-muted-foreground'}`}>
                    • At least 12+ characters
                  </Text>
                  <Text className={`text-[14px] font-sans ${hasNumber ? 'text-primary' : 'text-muted-foreground'}`}>
                    • Must have a number (0–9)
                  </Text>
                  <Text className={`text-[14px] font-sans ${hasSpecial ? 'text-primary' : 'text-muted-foreground'}`}>
                    • Must have a special symbol (e.g., !@#$)
                  </Text>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <Text className="text-[14px] font-sans text-destructive mt-1">
                      • Passwords do not match
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Finish Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFinish}
              disabled={!isFormValid}
              className={`w-full h-[45px] rounded-[50px] items-center justify-center ${
                isFormValid ? 'bg-primary' : 'bg-[#E2E1DC]'
              }`}
            >
              <Text className={`text-[14px] font-bold ${
                isFormValid ? 'text-primary-foreground' : 'text-[#96958F]'
              }`}>
                Finish
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
