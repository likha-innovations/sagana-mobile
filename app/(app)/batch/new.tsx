import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { toast } from 'burnt';

import { useDynamicLayout } from '@/hooks/use-layout';
import { useMachines } from '@/hooks/use-machines';
import { useFeedstocks, useCreateCompostBatch } from '@/hooks/use-batches';
import type { FeedstockCategory } from '@/types/batch';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface SelectedFeedstockState {
  [feedstockId: string]: string; // weight string entered by user
}

export default function NewBatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ machineId?: string }>();
  const { insets, headerPaddingTop, stackScrollPadding } = useDynamicLayout();

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(params.machineId ?? '');
  const machineModalRef = useRef<BottomSheetModal>(null);
  const [machineError, setMachineError] = useState<string | null>(null);

  const machineModalSnapPoints = useMemo(() => ['42%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const [selectedFeedstocks, setSelectedFeedstocks] = useState<SelectedFeedstockState>({});

  const { data: machines = [], isLoading: isMachinesLoading } = useMachines();
  const { data: feedstocks = [], isLoading: isFeedstocksLoading } = useFeedstocks();
  const createBatchMutation = useCreateCompostBatch();

  // Pre-select machine if passed via search params
  useEffect(() => {
    if (params.machineId) {
      setSelectedMachineId(params.machineId);
    }
  }, [params.machineId]);

  // Android hardware back handler: decrement step or exit screen
  useEffect(() => {
    const onBackPress = () => {
      if (step > 1 && step < 5) {
        setStep((prev) => (prev - 1) as WizardStep);
        return true;
      }
      if (step === 5) {
        router.replace('/(app)/(tabs)');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [step, router]);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.machine_id === selectedMachineId),
    [machines, selectedMachineId]
  );

  // Group feedstocks by category dynamically from data.json
  const categorizedFeedstocks = useMemo(() => {
    const categories: Record<FeedstockCategory, typeof feedstocks> = {
      Greens: [],
      Browns: [],
    };
    feedstocks.forEach((f) => {
      if (categories[f.category]) {
        categories[f.category].push(f);
      }
    });
    return categories;
  }, [feedstocks]);

  // Validation: Step 3 is valid if >= 1 feedstock is selected and all selected have positive weight
  const isStep3Valid = useMemo(() => {
    const keys = Object.keys(selectedFeedstocks);
    if (keys.length === 0) return false;
    return keys.every((key) => {
      const val = parseFloat(selectedFeedstocks[key]);
      return !isNaN(val) && val > 0;
    });
  }, [selectedFeedstocks]);

  // Handlers
  const handleBack = () => {
    if (step > 1 && step < 5) {
      setStep((prev) => (prev - 1) as WizardStep);
    } else {
      router.back();
    }
  };

  const handleStep1Next = () => {
    if (!selectedMachineId) {
      setMachineError('Please select a machine');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setMachineError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  const handleStep2Next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(3);
  };

  const handleToggleFeedstock = (feedstockId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFeedstocks((prev) => {
      const next = { ...prev };
      if (feedstockId in next) {
        delete next[feedstockId];
      } else {
        next[feedstockId] = '0';
      }
      return next;
    });
  };

  const handleWeightChange = (feedstockId: string, text: string) => {
    // ponytail: clean numeric filter allowing decimal values
    const clean = text.replace(/[^0-9.]/g, '');
    setSelectedFeedstocks((prev) => ({
      ...prev,
      [feedstockId]: clean,
    }));
  };

  const handleStep3Next = () => {
    if (!isStep3Valid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(4);
  };

  const handleStep4Submit = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const items = Object.entries(selectedFeedstocks).map(([feedstock_id, weightStr]) => ({
        feedstock_id,
        weight: parseFloat(weightStr) || 0,
      }));

      await createBatchMutation.mutateAsync({
        machine_id: selectedMachineId,
        feedstocks: items,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(5);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create batch';
      toast({
        title: 'Batch Creation Failed',
        message,
        preset: 'error',
      });
    }
  };

  const handleGoToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(app)/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-6" style={{ paddingTop: headerPaddingTop }}>
          {/* Header & Progress Indicator (Steps 1-4) */}
          {step < 5 && (
            <View className="flex-row items-center justify-between mb-8 relative h-10">
              <TouchableOpacity
                onPress={handleBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="z-10"
              >
                <ChevronLeft size={24} color="#414141" />
              </TouchableOpacity>

              {/* 4-Segment Progress Bar */}
              <View className="absolute left-0 right-0 flex-row items-center justify-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <View
                    key={s}
                    className={`h-[6px] w-[34px] rounded-full ${
                      s <= step ? 'bg-primary' : 'bg-[#DCDBD5]'
                    }`}
                  />
                ))}
              </View>

              <View className="w-6" />
            </View>
          )}

          {/* STEP 1: Select Available Machine */}
          {step === 1 && (
            <View className="flex-1 justify-between" style={{ paddingBottom: stackScrollPadding }}>
              <View>
                <Text className="text-[20px] font-bold text-foreground">
                  Select available machine
                </Text>
                <Text className="text-sm font-sans text-foreground mt-1 mb-8">
                  Select a machine where you want to start your compost batch.
                </Text>

                {/* Dropdown Input */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => machineModalRef.current?.present()}
                  className={`h-[58px] rounded-2xl border-[1.5px] px-4 flex-row items-center justify-between bg-card ${
                    machineError ? 'border-destructive' : 'border-border'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedMachine
                        ? 'font-medium text-foreground'
                        : 'font-sans text-muted-foreground'
                    }`}
                  >
                    {selectedMachine ? selectedMachine.name : 'Machine'}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={machineError ? '#E84C4C' : '#AFAEA7'}
                  />
                </TouchableOpacity>

                {/* Inline Error Helper */}
                {machineError && (
                  <Text className="text-xs font-medium text-destructive mt-1">
                    {machineError}
                  </Text>
                )}
              </View>

              {/* Next Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleStep1Next}
                className="h-[45px] rounded-full bg-primary items-center justify-center"
              >
                <Text className="text-sm font-bold text-[#FAF9EE]">Next</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Machine Turned On Check */}
          {step === 2 && (
            <View className="flex-1 justify-between" style={{ paddingBottom: stackScrollPadding }}>
              <View>
                <Text className="text-[20px] font-bold text-foreground">
                  Make sure your machine is on
                </Text>
                <Text className="text-sm font-sans text-foreground mt-1 mb-8">
                  Before you create a compost batch, make sure that your machine is on.
                </Text>
              </View>

              {/* Plain Gray Box Placeholder */}
              <View className="h-[260px] w-full rounded-2xl bg-skeleton my-auto" />

              {/* Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleStep2Next}
                className="h-[45px] rounded-full bg-primary items-center justify-center"
              >
                <Text className="text-sm font-bold text-[#FAF9EE]">
                  My machine is now turned on
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Feedstocks Checklist & Weight Inputs */}
          {step === 3 && (
            <View className="flex-1">
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: stackScrollPadding + 60 }}
              >
                <Text className="text-[20px] font-bold text-foreground">
                  What are your feedstocks?
                </Text>
                <Text className="text-sm font-sans text-foreground mt-1 mb-6">
                  Select the feedstocks you will put into the machine and their weight.
                </Text>

                {isFeedstocksLoading ? (
                  <ActivityIndicator color="#718619" className="my-8" />
                ) : (
                  (['Greens', 'Browns'] as FeedstockCategory[]).map((category) => {
                    const items = categorizedFeedstocks[category] ?? [];
                    if (items.length === 0) return null;

                    return (
                      <View key={category} className="mb-4">
                        <Text className="text-sm font-bold text-foreground mb-3">
                          {category}
                        </Text>

                        {items.map((feedstock) => {
                          const isSelected = feedstock.feedstock_id in selectedFeedstocks;
                          const weightValue = selectedFeedstocks[feedstock.feedstock_id] ?? '0';

                          return (
                            <View
                              key={feedstock.feedstock_id}
                              className="bg-card rounded-2xl border border-border p-4 mb-3"
                            >
                              {/* Top Row: Placeholder, Name, Toggle */}
                              <Pressable
                                onPress={() => handleToggleFeedstock(feedstock.feedstock_id)}
                                className="flex-row items-center justify-between"
                              >
                                <View className="flex-row items-center flex-1 pr-3">
                                  {/* Plain Gray Box Placeholder for image */}
                                  <View className="w-12 h-12 rounded-xl bg-skeleton mr-3" />
                                  <Text className="text-sm font-medium text-foreground flex-1">
                                    {feedstock.name}
                                  </Text>
                                </View>

                                {/* Radio Circle */}
                                <View
                                  className={`w-[22px] h-[22px] rounded-full items-center justify-center border-[1.5px] ${
                                    isSelected
                                      ? 'border-primary'
                                      : 'border-border'
                                  }`}
                                >
                                  {isSelected && (
                                    <View className="w-3 h-3 rounded-full bg-primary" />
                                  )}
                                </View>
                              </Pressable>

                              {/* Expandable Weight Input */}
                              {isSelected && (
                                <View className="h-[58px] rounded-2xl border-[1.5px] border-border bg-[#FAF9EE] px-4 flex-row items-center justify-between mt-3">
                                  <Text className="text-[13px] font-sans text-muted-foreground">
                                    Weight
                                  </Text>
                                  <View className="flex-row items-center">
                                    <TextInput
                                      keyboardType="decimal-pad"
                                      value={weightValue}
                                      onChangeText={(t) =>
                                        handleWeightChange(feedstock.feedstock_id, t)
                                      }
                                      className="text-sm font-sans text-foreground text-right p-0 mr-1 min-w-[40px]"
                                      placeholder="0"
                                      placeholderTextColor="#AFAEA7"
                                      selectTextOnFocus
                                    />
                                    <Text className="text-sm font-sans text-muted-foreground">
                                      kg
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Pinned Bottom Next Button */}
              <View
                className="absolute left-0 right-0"
                style={{ bottom: insets.bottom + 12 }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={!isStep3Valid}
                  onPress={handleStep3Next}
                  className={`h-[45px] rounded-full items-center justify-center ${
                    isStep3Valid ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isStep3Valid ? 'text-[#FAF9EE]' : 'text-muted-foreground'
                    }`}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: Transfer Feedstocks to Machine */}
          {step === 4 && (
            <View className="flex-1 justify-between" style={{ paddingBottom: stackScrollPadding }}>
              <View>
                <Text className="text-[20px] font-bold text-foreground">
                  Transfer the feedstocks to the machine
                </Text>
                <Text className="text-sm font-sans text-foreground mt-1 mb-8">
                  Make sure to distribute the feedstock evenly inside the machine.
                </Text>
              </View>

              {/* Plain Gray Box Placeholder */}
              <View className="h-[260px] w-full rounded-2xl bg-skeleton my-auto" />

              {/* Mutation Dispatch Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={createBatchMutation.isPending}
                onPress={handleStep4Submit}
                className="h-[45px] rounded-full bg-primary items-center justify-center"
              >
                {createBatchMutation.isPending ? (
                  <ActivityIndicator color="#FAF9EE" />
                ) : (
                  <Text className="text-sm font-bold text-[#FAF9EE]">
                    I have transferred the feedstocks
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && (
            <View className="flex-1 justify-between" style={{ paddingBottom: stackScrollPadding }}>
              <View>
                {/* Top Illustration Placeholder */}
                <View className="h-[182px] w-full rounded-2xl bg-skeleton mt-8 mb-6" />

                <Text className="text-[20px] font-bold text-foreground mb-2">
                  Batch has been started!
                </Text>
                <Text className="text-sm font-sans text-foreground leading-5">
                  You can now monitor the batch through the app dashboard or your machine.
                </Text>
              </View>

              {/* Go to Home Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleGoToHome}
                className="h-[45px] rounded-full bg-primary items-center justify-center"
              >
                <Text className="text-sm font-bold text-[#FAF9EE]">Go to Home</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Machine Selection Bottom Sheet Modal */}
          <BottomSheetModal
            ref={machineModalRef}
            snapPoints={machineModalSnapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={{
              backgroundColor: '#FAF9EE',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
            handleIndicatorStyle={{
              backgroundColor: '#DCDBD5',
              width: 40,
              height: 4,
            }}
          >
            <BottomSheetView
              className="px-6 pt-2"
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            >
              {isMachinesLoading ? (
                <ActivityIndicator color="#718619" className="my-6" />
              ) : (
                machines.map((m) => {
                  const isAvailable = m.status === 'available';

                  return (
                    <TouchableOpacity
                      key={m.machine_id}
                      disabled={!isAvailable}
                      onPress={() => {
                        setSelectedMachineId(m.machine_id);
                        setMachineError(null);
                        machineModalRef.current?.dismiss();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.7}
                      className={`h-[60px] rounded-2xl border border-border px-4 flex-row items-center justify-between mb-3 bg-card ${
                        !isAvailable ? 'opacity-70' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          isAvailable ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {m.name}
                      </Text>
                      <Text
                        className={`text-sm font-medium ${
                          isAvailable ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {isAvailable ? 'Available' : 'Composting'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
