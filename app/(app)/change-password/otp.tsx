import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function OTPCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [code, setCode] = useState('');
  const CODE_LENGTH = 6;

  const handleNext = () => {
    if (code.length === CODE_LENGTH) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/change-password/new-password');
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
                  <View className="flex-1 h-full bg-[#C8C7BE] rounded-[14px]" />
                </View>
              </View>
            </View>

            {/* Content */}
            <View className="gap-8 flex-1">
              <View className="gap-2.5">
                <Text className="text-[20px] font-bold text-foreground">
                  Enter one-time code
                </Text>
                <Text className="text-[14px] text-foreground font-sans">
                  To reset your password, kindly check your email for an OTP and enter it here.
                </Text>
              </View>

              <View className="items-center w-full gap-3">
                {/* Custom OTP Input Display */}
                <View className="flex-row justify-between w-full relative h-[61px]">
                  <TextInput
                    value={code}
                    onChangeText={(val) => {
                      const numeric = val.replace(/[^0-9]/g, '');
                      setCode(numeric.slice(0, CODE_LENGTH));
                    }}
                    keyboardType="number-pad"
                    className="absolute w-full h-full opacity-0 z-10"
                    maxLength={CODE_LENGTH}
                    autoFocus
                  />
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                    const char = code[index] || '';
                    const isFocused = code.length === index;
                    return (
                      <View
                        key={index}
                        className={`w-[52px] h-[61px] rounded-[14px] items-center justify-center bg-card border-[1.5px] ${
                          isFocused ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <Text className="text-[24px] font-bold text-foreground">
                          {char}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Resend Link */}
                <View className="flex-row items-center mt-4">
                  <Text className="text-[14px] text-primary font-semibold">
                    Didn't receive any code?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                    <Text className="text-[14px] text-primary font-bold">Resend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={code.length < CODE_LENGTH}
              className={`w-full h-[45px] rounded-[50px] items-center justify-center ${
                code.length === CODE_LENGTH ? 'bg-primary' : 'bg-[#E2E1DC]'
              }`}
            >
              <Text className={`text-[14px] font-bold ${
                code.length === CODE_LENGTH ? 'text-primary-foreground' : 'text-[#96958F]'
              }`}>
                Next
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
