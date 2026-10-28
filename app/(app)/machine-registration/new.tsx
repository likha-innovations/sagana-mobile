import { useState } from 'react';
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
import { toast } from 'burnt';
import * as Haptics from 'expo-haptics';
import { useDynamicLayout, useRegisterMachine } from '@/hooks';
import { createLogger } from '@/lib/logger';
import { useAuthContext } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { ApiError, machineRegistrationSchema, type MachineRegistrationInput } from '@/types';
import { useBluetooth } from '@/hooks/use-bluetooth';
import { 
  TurnOnStep, 
  ConnectStep, 
  WifiCredentialsStep, 
  NameMachineStep, 
  SuccessStep 
} from '@/components/devices/registration-steps';

const logger = createLogger('AddMachineScreen');

export default function AddMachineScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { insets, stackScrollPadding } = useDynamicLayout();
  const [step, setStep] = useState(1);
  const [isWriting, setIsWriting] = useState(false);
  const [confirmedMac, setConfirmedMac] = useState<string | null>(null);
  const registerMachineMutation = useRegisterMachine();

  const { 
    status, 
    devices, 
    connectedDevice,
    connectingDeviceId,
    hardwareMac,
    errorMessage,
    provisioningStatus,
    provisioningError,
    startScan,
    connectToDevice,
    provisionWifi,
    writeMachineName,
    clearProvisioningError,
    reset 
  } = useBluetooth();

  const isConnectingWifi = isWriting || provisioningStatus === 'testing-wifi';

  const { control, trigger, getValues, setValue } = useForm<MachineRegistrationInput>({
    resolver: zodResolver(machineRegistrationSchema),
    defaultValues: { ssid: '', password: '', machineName: '' },
    mode: 'onChange'
  });

  const handleNext = async () => {
    // Step 1: Start scanning
    if (step === 1) {
      setStep(2);
      startScan();
      return;
    }

    // Step 2 & 3: Connection phase
    if (step === 2 || step === 3) {
      if (status !== 'connected') {
        toast({ title: 'Please select and connect to a machine first.', preset: 'error' });
        return;
      }
      setStep(4);
      return;
    }

    // Step 4: Wi-Fi credentials phase
    if (step === 4) {
      const isWifiValid = await trigger(['ssid', 'password']);
      if (!isWifiValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      try {
        setIsWriting(true);
        const { ssid, password } = getValues();
        const mac = await provisionWifi(ssid, password);
        if (mac) {
          setConfirmedMac(mac);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast({ title: 'Wi-Fi Connected!', preset: 'done' });
        setIsWriting(false);
        setStep(5);
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMsg = error instanceof Error 
          ? error.message 
          : 'Failed to connect to WiFi. Please check your credentials and try again.';
        toast({ title: 'Connection Failed', message: errorMsg, preset: 'error' });
        setIsWriting(false);
      }
      return;
    }

    // Step 5: Machine naming & backend registration phase
    if (step === 5) {
      const isNameValid = await trigger(['machineName']);
      if (!isNameValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const { machineName, ssid } = getValues();
      const macAddress = confirmedMac || hardwareMac || connectedDevice?.id;

      if (!macAddress) {
        toast({ title: 'Device Missing', message: 'Machine connection was lost. Please reconnect.', preset: 'error' });
        return;
      }

      try {
        setIsWriting(true);

        // 1. Send machine name and userId to ESP32 firmware over BLE
        try {
          await writeMachineName(machineName, user?.id);
        } catch (bleError) {
          logger.warn('Could not write machine name over BLE, proceeding with backend registration', bleError);
        }

        // 2. Register machine in backend database using physical hardware MAC
        await registerMachineMutation.mutateAsync({
          name: machineName.trim(),
          mac_address: macAddress,
          wifi_ssid: ssid,
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast({ title: 'Machine Registered!', preset: 'done' });
        setIsWriting(false);
        setStep(6);
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsWriting(false);

        if (error instanceof ApiError) {
          if (error.statusCode === 409) {
            toast({
              title: 'Device Already Registered',
              message: 'This machine is already registered in the system.',
              preset: 'error',
            });
            return;
          }
          if (error.statusCode === 404) {
            toast({
              title: 'Barangay Not Assigned',
              message: 'Your account is not assigned to a barangay. Contact your administrator.',
              preset: 'error',
            });
            return;
          }
        }

        const errorMsg = error instanceof Error 
          ? error.message 
          : 'Failed to complete machine registration.';
        toast({ title: 'Registration Failed', message: errorMsg, preset: 'error' });
      }
      return;
    }
    
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (isConnectingWifi || isWriting) return;

    if (step > 1) {
      if (step === 4) {
        clearProvisioningError();
        setStep(2);
        return;
      }
      if (step === 2 || step === 3) {
        reset();
        setStep(1);
        return;
      }
      setStep((prev) => prev - 1);
    } else {
      reset();
      router.back();
    }
  };

  const handleFinishFlow = () => {
    // Terminate BLE link once registration completes and navigate to dashboard
    reset();
    router.replace('/(app)/(tabs)');
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
              <Pressable 
                onPress={handleBack} 
                disabled={isConnectingWifi || isWriting}
                className="p-2 -ml-2 rounded-full active:bg-muted disabled:opacity-30"
              >
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
                connectingDeviceId={connectingDeviceId}
                errorMessage={errorMessage}
                onConnect={connectToDevice}
                onRetry={startScan} 
              />
            )}
            
            {step === 4 && (
              <WifiCredentialsStep 
                control={control} 
                setValue={setValue} 
                isConnecting={isConnectingWifi}
                errorMessage={provisioningError}
              />
            )}
            {step === 5 && <NameMachineStep control={control} />}
            {step === 6 && <SuccessStep />}

            <View className="flex-1 min-h-[40px]" />

            <View className="mt-auto pt-4">
              {step === 4 ? (
                <Button 
                  title={isConnectingWifi ? "Connecting device to WiFi..." : "Submit"} 
                  onPress={handleNext} 
                  disabled={isConnectingWifi}
                  loading={isConnectingWifi}
                  haptic 
                />
              ) : step < 4 ? (
                <Button 
                  title="Next" 
                  onPress={handleNext} 
                  disabled={(step === 2 || step === 3) ? status !== 'connected' : false}
                  haptic 
                />
              ) : step === 5 ? (
                <Button 
                  title="Finish" 
                  onPress={handleNext} 
                  disabled={isWriting}
                  loading={isWriting}
                  haptic 
                />
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
