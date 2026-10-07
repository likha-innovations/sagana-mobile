import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Calendar, Check, Pencil, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import { useToast } from '@/components/ui/toast';

import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useBarangays } from '@/hooks/use-barangays';
import { useDynamicLayout } from '@/hooks';
import { updateProfileSchema, type UpdateProfileInput } from '@/types/auth';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function EditProfileScreen() {
  const { insets, stackScrollPadding } = useDynamicLayout();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: barangays = [] } = useBarangays();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const [isEditing, setIsEditing] = useState(false);
  const [isBackModalVisible, setIsBackModalVisible] = useState(false);
  const { showToast } = useToast();

  // Split full name for initial values
  const parts = (profile?.fullName || '').split(' ');
  const initialFirstName = parts.length > 0 ? parts[0] : '';
  const initialLastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  
  // Resolve barangay ID from potentially complex object
  let initialBarangayId = '';
  if (profile?.barangay) {
    if (typeof profile.barangay === 'object' && profile.barangay.id) {
      initialBarangayId = profile.barangay.id;
    } else if (typeof profile.barangay === 'string') {
      initialBarangayId = profile.barangay;
    }
  }

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
      birthday: profile?.birthday || '',
      barangayId: initialBarangayId,
    },
  });

  const selectedBarangayId = watch('barangayId');
  const selectedBarangay = barangays.find((b) => b.id === selectedBarangayId);
  const selectedBarangayName = selectedBarangay?.name || '';

  const handlePresentModalPress = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  const onSubmit = async (data: UpdateProfileInput) => {
    Keyboard.dismiss();
    try {
      await updateProfile(data);
      setIsEditing(false);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Profile updated successfully.', 'success');
      }
    } catch (error) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Failed to update profile.', 'error');
      }
    }
  };

  const handleBackPress = () => {
    if (isEditing) {
      setIsBackModalVisible(true);
    } else {
      router.back();
    }
  };

  const handleConfirmGoBack = () => {
    setIsBackModalVisible(false);
    setIsEditing(false);
    router.back();
  };

  const handleCancelGoBack = () => {
    setIsBackModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-background">
          <View
            style={{
              paddingTop: Math.max(insets.top, 48),
              paddingHorizontal: 16,
              paddingBottom: 20,
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleBackPress}
                className="p-2 -ml-2"
              >
                <ChevronLeft size={24} color="#414141" />
              </TouchableOpacity>
              <Text className="text-[16px] font-bold text-foreground">
                Profile Information
              </Text>
            </View>

            {isEditing ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSubmit(onSubmit)}
                disabled={isPending}
                className="p-2 -mr-2"
              >
                <Text className="text-[16px] font-bold text-primary">Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsEditing(true)}
                className="p-2 -mr-2"
              >
                <Pencil size={20} color="#414141" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: stackScrollPadding,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-3 mt-4">
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="First Name"
                    placeholder="Enter first name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.firstName?.message}
                    editable={isEditing}
                  />
                )}
              />

              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Last Name"
                    placeholder="Enter last name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.lastName?.message}
                    editable={isEditing}
                  />
                )}
              />

              <Controller
                control={control}
                name="birthday"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Birthday"
                    placeholder="January 1, 2000"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.birthday?.message}
                    trailingIcon={<Calendar size={20} color="#AFAEA7" />}
                    editable={isEditing}
                  />
                )}
              />

              <Controller
                control={control}
                name="barangayId"
                render={({ field: { value } }) => (
                  <TouchableOpacity
                    activeOpacity={isEditing ? 0.8 : 1}
                    onPress={isEditing ? handlePresentModalPress : undefined}
                  >
                    <View pointerEvents="none">
                      <Input
                        label="Barangay"
                        placeholder="Select barangay"
                        value={selectedBarangayName}
                        error={errors.barangayId?.message}
                        trailingIcon={<ChevronDown size={20} color="#AFAEA7" />}
                        editable={false}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#FAF9EE' }}
        handleIndicatorStyle={{ backgroundColor: '#C8C8C2' }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <View className="px-6 py-4">
            <Text className="text-xl font-bold text-foreground mb-4">Select Barangay</Text>
            {barangays.map((barangay) => {
              const isSelected = selectedBarangayId === barangay.id;
              return (
                <TouchableOpacity
                  key={barangay.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setValue('barangayId', barangay.id, { shouldValidate: true });
                    handleCloseModal();
                  }}
                  className={`flex-row items-center justify-between py-4 border-b border-border ${isSelected ? 'bg-primary/5 px-2 rounded-lg' : ''}`}
                >
                  <Text
                    className={`text-base ${isSelected ? 'font-bold text-primary' : 'font-medium text-foreground'}`}
                  >
                    {barangay.name}
                  </Text>
                  {isSelected && <Check size={20} color="#718619" />}
                </TouchableOpacity>
              );
            })}
            {barangays.length === 0 && (
              <Text className="text-muted-foreground text-center py-8">
                No barangays available.
              </Text>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <ConfirmModal
        visible={isBackModalVisible}
        title="Go Back?"
        description="Your details won't be saved."
        cancelText="Cancel"
        confirmText="Yes, go back"
        onCancel={handleCancelGoBack}
        onConfirm={handleConfirmGoBack}
      />
    </KeyboardAvoidingView>
  );
}
