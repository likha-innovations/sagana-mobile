import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useMachine, useUpdateMachineName } from '@/hooks/use-machines';

export default function ChangeNameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: machine } = useMachine(id);
  const { mutate: updateName, isPending } = useUpdateMachineName();
  
  const [name, setName] = useState('');

  useEffect(() => {
    if (machine) {
      setName(machine.name);
    }
  }, [machine]);

  const handleSave = () => {
    if (!name.trim()) return;
    updateName(
      { id, name: name.trim() },
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
          {/* Header */}
          <View className="flex-row items-center px-4 py-4 border-b border-border">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-neutral-100">
              <ChevronLeft size={24} color="#414141" />
            </Pressable>
            <Text className="text-lg font-bold text-text-foreground ml-2">
              Change Machine Name
            </Text>
          </View>

          <ScrollView 
            className="flex-1 px-4 pt-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-semibold text-text-foreground mb-2">
              Machine Name
            </Text>
            <TextInput
              className="bg-card border-[1.5px] border-input rounded-2xl p-4 text-base font-medium text-text-foreground mb-6"
              value={name}
              onChangeText={setName}
              placeholder="e.g. AIVSP Unit 1"
              placeholderTextColor="#AFAEA7"
              autoFocus
            />

            <Pressable
              onPress={handleSave}
              disabled={isPending || !name.trim()}
              className={`rounded-full p-4 items-center justify-center ${
                !name.trim() || isPending ? 'bg-secondary' : 'bg-primary'
              }`}
            >
              {isPending ? (
                <ActivityIndicator color={!name.trim() ? '#AFAEA7' : '#FFFFFF'} />
              ) : (
                <Text className={`text-base font-bold ${!name.trim() ? 'text-muted-foreground' : 'text-white'}`}>
                  Save Changes
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
