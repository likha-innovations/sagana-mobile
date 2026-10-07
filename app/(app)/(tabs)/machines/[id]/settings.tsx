import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, PencilLine, Wifi, Trash2, CircleAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  useMachine,
  useUpdateMachineName,
  useUpdateMachineWifi,
  useRemoveMachine,
} from '@/hooks/use-machines';
import { useDynamicLayout } from '@/hooks';
import { useToast } from '@/components/ui/toast';

type SettingsView = 'menu' | 'rename' | 'wifi';

export default function MachineSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { insets, stackScrollPadding } = useDynamicLayout();
  const { showToast } = useToast();

  const { data: machine, isLoading } = useMachine(id);
  const { mutate: updateName, isPending: isUpdatingName } = useUpdateMachineName();
  const { mutate: updateWifi, isPending: isUpdatingWifi } = useUpdateMachineWifi();
  const { mutate: removeMachine, isPending: isRemoving } = useRemoveMachine();

  const [activeView, setActiveView] = useState<SettingsView>('menu');
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);

  const [ssid, setSsid] = useState('');
  const [ssidError, setSsidError] = useState(false);
  const [password, setPassword] = useState('');

  // Sync initial machine values
  useEffect(() => {
    if (machine) {
      setName(machine.name);
      setSsid(machine.wifi_ssid || '');
    }
  }, [machine]);

  // Handle hardware back on Android to return to menu first
  useEffect(() => {
    const handleBackPress = () => {
      if (activeView !== 'menu') {
        setActiveView('menu');
        setNameError(false);
        setSsidError(false);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [activeView]);

  const handleHeaderBack = () => {
    if (activeView !== 'menu') {
      setActiveView('menu');
      setNameError(false);
      setSsidError(false);
    } else {
      router.back();
    }
  };

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setNameError(false);
    updateName(
      { id, name: trimmed },
      {
        onSuccess: () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          showToast('Machine name updated successfully.', 'success');
          setActiveView('menu');
        },
        onError: () => {
          showToast('Failed to update machine name.', 'error');
        },
      }
    );
  };

  const handleSaveWifi = () => {
    const trimmedSsid = ssid.trim();
    if (!trimmedSsid) {
      setSsidError(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setSsidError(false);
    updateWifi(
      { id, wifi_ssid: trimmedSsid },
      {
        onSuccess: () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          showToast('Wi-Fi credentials updated successfully.', 'success');
          setActiveView('menu');
        },
        onError: () => {
          showToast('Cannot change Wi’FI. Please check the details being entered or try again later.', 'error');
        },
      }
    );
  };

  const handleConfirmRemove = () => {
    removeMachine(id, {
      onSuccess: () => {
        setIsRemoveModalVisible(false);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.dismissAll();
        router.push('/(app)/(tabs)/machines' as any);
      },
      onError: () => {
        showToast('Failed to remove machine.', 'error');
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="small" color="#718619" />
      </View>
    );
  }

  // Header Title & Action resolver
  // Save button condition (Figma shows Save only when modified or on error)
  const isNameDirty = name.trim() !== (machine?.name || '');
  const showSaveName = isNameDirty || nameError;

  const isWifiDirty = ssid.trim() !== (machine?.wifi_ssid || '') || password.length > 0;
  const showSaveWifi = isWifiDirty || ssidError;

  // Header Title & Action resolver
  let headerTitle = 'Machine Settings';
  if (activeView === 'rename') headerTitle = 'Rename Machine';
  if (activeView === 'wifi') headerTitle = 'Change Wi-Fi Credentials';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          
          {/* Header (No bottom border in Figma) */}
          <View className="flex-row items-center justify-between px-4 py-4 min-h-[56px]">
            <View className="flex-row items-center">
              <Pressable
                onPress={handleHeaderBack}
                hitSlop={12}
                className="w-[30px] h-[30px] items-center justify-center -ml-1 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ChevronLeft size={24} color="#414141" />
              </Pressable>
              <Text className="text-base font-bold text-foreground ml-2">
                {headerTitle}
              </Text>
            </View>

            {activeView === 'rename' && showSaveName && (
              <Pressable
                onPress={handleSaveName}
                disabled={isUpdatingName}
                hitSlop={12}
                className="active:opacity-70"
              >
                {isUpdatingName ? (
                  <ActivityIndicator size="small" color="#718619" />
                ) : (
                  <Text className="text-base font-bold text-primary">Save</Text>
                )}
              </Pressable>
            )}

            {activeView === 'wifi' && showSaveWifi && (
              <Pressable
                onPress={handleSaveWifi}
                disabled={isUpdatingWifi}
                hitSlop={12}
                className="active:opacity-70"
              >
                {isUpdatingWifi ? (
                  <ActivityIndicator size="small" color="#718619" />
                ) : (
                  <Text className="text-base font-bold text-primary">Save</Text>
                )}
              </Pressable>
            )}
          </View>

          {/* Body Content */}
          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: stackScrollPadding }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* View 1: Settings Menu */}
            {activeView === 'menu' && (
              <View className="gap-3">
                {/* Rename Machine */}
                <Pressable
                  onPress={() => {
                    setName(machine?.name || '');
                    setNameError(false);
                    setActiveView('rename');
                  }}
                  className="flex-row items-center h-[60px] px-[18px] py-[10px] bg-card border border-input rounded-lg gap-4 active:opacity-80"
                >
                  <PencilLine size={18} color="#414141" strokeWidth={1.5} />
                  <Text className="text-sm font-sans text-foreground flex-1">
                    Rename Machine
                  </Text>
                </Pressable>

                {/* Change Wi-Fi Credentials */}
                <Pressable
                  onPress={() => {
                    setSsid(machine?.wifi_ssid || '');
                    setPassword('');
                    setSsidError(false);
                    setActiveView('wifi');
                  }}
                  className="flex-row items-center h-[60px] px-[18px] py-[10px] bg-card border border-input rounded-lg gap-4 active:opacity-80"
                >
                  <Wifi size={18} color="#414141" strokeWidth={1.5} />
                  <Text className="text-sm font-sans text-foreground flex-1">
                    Change Wi-Fi Credentials
                  </Text>
                </Pressable>

                {/* Remove Machine (Destructive) */}
                <Pressable
                  onPress={() => setIsRemoveModalVisible(true)}
                  className="flex-row items-center h-[60px] px-[18px] py-[10px] bg-card border border-input rounded-lg gap-4 active:opacity-80"
                >
                  <Trash2 size={18} color="#E84C4C" strokeWidth={1.5} />
                  <Text className="text-sm font-sans text-destructive flex-1">
                    Remove Machine
                  </Text>
                </Pressable>
              </View>
            )}

            {/* View 2: Rename Machine View */}
            {activeView === 'rename' && (
              <View>
                <View
                  className={`h-[58px] bg-card rounded-[14px] px-[15px] py-[10px] justify-center border-[1.5px] ${
                    nameError ? 'border-destructive' : 'border-border'
                  }`}
                >
                  {nameError ? (
                    <View className="flex-row items-center justify-between flex-1">
                      <TextInput
                        value={name}
                        onChangeText={(val) => {
                          setName(val);
                          if (nameError) setNameError(false);
                        }}
                        placeholder="Machine Name"
                        placeholderTextColor="#E84C4C"
                        className="text-sm font-sans text-destructive p-0 flex-1"
                        autoFocus
                      />
                      <CircleAlert size={20} color="#E84C4C" strokeWidth={1.5} />
                    </View>
                  ) : (
                    <>
                      <Text className="text-[13px] font-sans text-muted-foreground">
                        Machine Name
                      </Text>
                      <TextInput
                        value={name}
                        onChangeText={(val) => {
                          setName(val);
                          if (nameError) setNameError(false);
                        }}
                        placeholder="Machine Name"
                        placeholderTextColor="#AFAEA7"
                        className="text-sm font-sans text-foreground p-0 mt-0.5"
                        autoFocus
                      />
                    </>
                  )}
                </View>
                {nameError && (
                  <Text className="text-sm font-sans text-destructive mt-2 px-1">
                    Please enter required field
                  </Text>
                )}
              </View>
            )}

            {/* View 3: Change Wi-Fi Credentials View */}
            {activeView === 'wifi' && (
              <View className="gap-6">
                {/* Active Connection Badge Card */}
                <View className="flex-row items-center p-[16px] bg-card border border-input rounded-[14px] gap-4">
                  <Wifi size={24} color="#414141" strokeWidth={1.5} />
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-bold text-foreground">
                      {machine?.wifi_ssid || 'Home Wifi'}
                    </Text>
                    <Text className="text-sm font-sans text-primary">
                      Connected
                    </Text>
                  </View>
                </View>

                {/* Form Inputs */}
                <View className="gap-3">
                  {/* SSID Input */}
                  <View>
                    <View
                      className={`h-[58px] bg-card rounded-[14px] px-[15px] py-[10px] justify-center border-[1.5px] ${
                        ssidError ? 'border-destructive' : 'border-border'
                      }`}
                    >
                      {ssidError ? (
                        <View className="flex-row items-center justify-between flex-1">
                          <TextInput
                            value={ssid}
                            onChangeText={(val) => {
                              setSsid(val);
                              if (ssidError) setSsidError(false);
                            }}
                            placeholder="SSID"
                            placeholderTextColor="#E84C4C"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="text-sm font-sans text-destructive p-0 flex-1"
                            autoFocus
                          />
                          <CircleAlert size={20} color="#E84C4C" strokeWidth={1.5} />
                        </View>
                      ) : (
                        <>
                          <Text className="text-[13px] font-sans text-muted-foreground">
                            SSID
                          </Text>
                          <TextInput
                            value={ssid}
                            onChangeText={(val) => {
                              setSsid(val);
                              if (ssidError) setSsidError(false);
                            }}
                            placeholder="SSID"
                            placeholderTextColor="#AFAEA7"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="text-sm font-sans text-foreground p-0 mt-0.5"
                          />
                        </>
                      )}
                    </View>
                    {ssidError && (
                      <Text className="text-sm font-sans text-destructive mt-2 px-1">
                        Please enter required field
                      </Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View
                    className="h-[58px] bg-card rounded-[14px] px-[15px] py-[10px] justify-center border-[1.5px] border-border"
                  >
                    <Text className="text-[13px] font-sans text-muted-foreground">
                      Wi-Fi Password
                    </Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••••"
                      placeholderTextColor="#AFAEA7"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="text-sm font-sans text-foreground p-0 mt-0.5"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Remove Machine Confirmation Modal */}
          <Modal
            visible={isRemoveModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsRemoveModalVisible(false)}
          >
            <View className="flex-1 bg-black/50 items-center justify-center px-4">
              <View className="w-full max-w-[356px] bg-card border border-input rounded-[14px] p-6 gap-6 items-center shadow-md">
                <View className="gap-2.5 items-center">
                  <Text className="text-sm font-bold text-foreground text-center">
                    Remove machine?
                  </Text>
                  <Text className="text-sm font-sans text-foreground text-center leading-5">
                    Ongoing compost process on this machine will be halted, and you will need to re-add the machine.
                  </Text>
                </View>

                <View className="flex-row w-full gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsRemoveModalVisible(false)}
                    disabled={isRemoving}
                    className="flex-1 h-[45px] bg-secondary rounded-full items-center justify-center active:opacity-70"
                  >
                    <Text className="text-sm font-bold text-foreground">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmRemove}
                    disabled={isRemoving}
                    className="flex-1 h-[45px] bg-destructive rounded-full items-center justify-center active:opacity-70"
                  >
                    {isRemoving ? (
                      <ActivityIndicator size="small" color="#FAF9EE" />
                    ) : (
                      <Text className="text-sm font-bold text-primary-foreground">
                        Yes, remove it
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
