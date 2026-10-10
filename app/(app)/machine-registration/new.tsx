import { useState, useEffect } from 'react';
import { 
  View, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as burnt from 'burnt';
import { useDynamicLayout } from '@/hooks';
import { Button } from '@/components/ui/button';
import { machineRegistrationSchema, type MachineRegistrationInput } from '@/types/device';
import { useBluetooth } from '@/hooks/use-bluetooth';
import { 
  TurnOnStep, 
  ConnectStep, 
  WifiCredentialsStep, 
  NameMachineStep, 
  SuccessStep 
} from '@/components/devices/registration-steps';

export default function AddMachineScreen() {
  const router = useRouter();
  const { insets, stackScrollPadding } = useDynamicLayout();
  const [step, setStep] = useState(1);
  const [isWriting, setIsWriting] = useState(false);

  // Manual BLE hook
  const { 
    status, 
    devices, 
    connectedDevice,
    errorMessage,
    startScan,
    connectToDevice,
    writeCredentials, 
    reset 
  } = useBluetooth();

  const { control, trigger, getValues, setValue } = useForm<MachineRegistrationInput>({
    resolver: zodResolver(machineRegistrationSchema),
    defaultValues: { ssid: '', password: '', machineName: '' },
    mode: 'onChange'
  });

  const handleNext = async () => {
    // Moving from Step 1 to Step 2: Start scanning
    if (step === 1) {
      setStep(2);
      startScan();
      return;
    }

    // Step 2 & 3: Connection phase
    if (step === 2 || step === 3) {
      if (status !== 'connected') {
        burnt.toast({ title: 'Please select and connect to a machine first.', preset: 'error' });
        return;
      }
    }

    // Step 4: Wi-Fi credentials phase
    if (step === 4) {
      const isWifiValid = await trigger(['ssid', 'password']);
      if (!isWifiValid) return;

      try {
        setIsWriting(true);
        const { ssid, password } = getValues();
        await writeCredentials(ssid, password);
      } catch (error) {
        burnt.toast({ title: 'Failed to send credentials to machine', preset: 'error' });
        setIsWriting(false);
        return;
      }
      setIsWriting(false);
    }

    // Step 5: Naming & Backend Registration phase
    if (step === 5) {
      const isNameValid = await trigger(['machineName']);
      if (!isNameValid) return;
      // TODO: Submit payload to backend POST /api/machines/register
    }
    
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      // If backing out of connection step, cancel scanning
      if (step === 2 || step === 3) {
        reset();
      }
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleFinishFlow = () => {
    router.back();
  };

  const getProgressDots = () => {
    if (step === 6) return null;
    let activeDot = 0;
    if (step === 2 || step === 3) activeDot = 1;
    if (step === 4) activeDot = 2;
    if (step === 5) activeDot = 3;

    return (
      <View className="flex-row items-center justify-center flex-1 space-x-2 mr-8">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={`h-1.5 w-8 rounded-full ${i === activeDot ? 'bg-primary' : 'bg-neutral-200'}`}
            style={i > 0 ? { marginLeft: 8 } : {}}
          />
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          {step < 6 && (
            <View className="flex-row items-center px-4 py-4 border-b border-transparent">
              <Pressable onPress={handleBack} className="p-2 -ml-2 rounded-full active:bg-muted">
                <ChevronLeft size={24} color="#414141" />
              </Pressable>
              {getProgressDots()}
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: stackScrollPadding }}
            className="px-6"
          >
            {step === 1 && <TurnOnStep />}
            
            {(step === 2 || step === 3) && (
              <ConnectStep 
                status={status} 
                devices={devices}
                connectedDevice={connectedDevice}
                errorMessage={errorMessage}
                onConnect={connectToDevice}
                onRetry={startScan} 
              />
            )}
            
            {step === 4 && <WifiCredentialsStep control={control} setValue={setValue} />}
            {step === 5 && <NameMachineStep control={control} />}
            {step === 6 && <SuccessStep />}

            <View className="flex-1 min-h-[40px]" />

            <View className="mt-auto pt-4">
              {step < 5 ? (
                <Button 
                  title="Next" 
                  onPress={handleNext} 
                  disabled={(step === 2 || step === 3) ? status !== 'connected' : isWriting}
                  loading={isWriting}
                  haptic 
                />
              ) : step === 5 ? (
                <Button title="Finish" onPress={handleNext} haptic />
              ) : (
                <Button title="Finish" onPress={handleFinishFlow} haptic />
              )}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
