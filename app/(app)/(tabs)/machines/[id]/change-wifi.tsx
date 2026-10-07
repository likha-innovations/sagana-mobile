import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMachine, useUpdateMachineWifi } from '@/hooks/use-machines';
import { useDynamicLayout } from '@/hooks';

export default function ChangeWifiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { insets, stackScrollPadding } = useDynamicLayout();
  
  const { data: machine } = useMachine(id);
  const { mutate: updateWifi, isPending } = useUpdateMachineWifi();
  
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (machine?.wifi_ssid) {
      setSsid(machine.wifi_ssid);
    }
  }, [machine]);

  const handleSave = () => {
    if (!ssid.trim()) return;
    updateWifi(
      { id, wifi_ssid: ssid.trim() },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-background"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="flex-row items-center px-4 py-4 border-b border-border">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-neutral-100">
              <ChevronLeft size={24} color="#414141" />
            </Pressable>
            <Text className="text-lg font-bold text-foreground ml-2">
              Wi-Fi Credentials
            </Text>
          </View>

          <ScrollView 
            className="flex-1 px-4 pt-6"
            contentContainerStyle={{ paddingBottom: stackScrollPadding }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-semibold text-foreground mb-2">
              Network Name (SSID)
            </Text>
            <TextInput
              className="bg-card border-[1.5px] border-input rounded-2xl p-4 text-base font-medium text-foreground mb-4"
              value={ssid}
              onChangeText={setSsid}
              placeholder="e.g. Home Wi-Fi"
              placeholderTextColor="#AFAEA7"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text className="text-sm font-semibold text-foreground mb-2">
              Password
            </Text>
            <TextInput
              className="bg-card border-[1.5px] border-input rounded-2xl p-4 text-base font-medium text-foreground mb-8"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#AFAEA7"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              onPress={handleSave}
              disabled={isPending || !ssid.trim()}
              className={`rounded-full p-4 items-center justify-center ${
                !ssid.trim() || isPending ? 'bg-secondary' : 'bg-primary'
              }`}
            >
              {isPending ? (
                <ActivityIndicator color={!ssid.trim() ? '#AFAEA7' : '#FFFFFF'} />
              ) : (
                <Text className={`text-base font-bold ${!ssid.trim() ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
                  Connect
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
