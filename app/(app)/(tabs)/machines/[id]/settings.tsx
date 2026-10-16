import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  PencilLine,
  Wifi,
  WifiOff,
  Trash2,
  AlertCircle,
  Info,
} from "lucide-react-native";
import {
  useMachine,
  useUpdateMachineName,
  useUpdateMachineWifi,
  useRemoveMachine,
} from "@/hooks/use-machines";
import { useDynamicLayout, useCurrentWifi } from "@/hooks";
import { useBluetooth } from "@/hooks/use-bluetooth";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryState } from "@/components/history/history-state";
import { CompostIcon } from "@/components/icons";
import { ConnectStep } from "@/components/devices/registration-steps";
import { colors } from "@/constants";
import { createLogger } from "@/lib/logger";
import { machineNameSchema, machineSsidSchema } from "@/lib/machine-overview";

const logger = createLogger("MachineSettingsScreen");

type SettingsView = "menu" | "rename" | "wifi-scan" | "wifi-form";

export default function MachineSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { headerPaddingTop, scrollPaddingBottom } = useDynamicLayout();
  const { showToast } = useToast();
  const { fetchWifi, isFetching: isFetchingWifi } = useCurrentWifi();

  const query = useMachine(id);
  const machine = query.data;

  const rename = useUpdateMachineName();
  const wifi = useUpdateMachineWifi();
  const remove = useRemoveMachine();

  const {
    status: bleStatus,
    devices: bleDevices,
    connectedDevice,
    connectingDeviceId,
    errorMessage: bleErrorMessage,
    provisioningStatus,
    provisioningError,
    startScan,
    connectToDevice,
    provisionWifi,
    clearProvisioningError,
    reset: resetBle,
  } = useBluetooth();

  const [view, setView] = useState<SettingsView>("menu");
  const [name, setName] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [removeVisible, setRemoveVisible] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  const pending =
    rename.isPending ||
    wifi.isPending ||
    remove.isPending ||
    isProvisioning ||
    provisioningStatus === "testing-wifi";

  const back = useCallback(() => {
    if (pending) return;
    if (view === "menu") {
      resetBle();
      router.back();
    } else if (view === "wifi-form") {
      setView("wifi-scan");
      setPassword("");
      setError("");
    } else {
      resetBle();
      setView("menu");
      setPassword("");
      setError("");
    }
  }, [pending, view, router, resetBle]);

  useFocusEffect(
    useCallback(() => {
      logger.screen("Machine Settings", { id, view });
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (pending) return true;
          if (view !== "menu") {
            back();
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [id, view, pending, back]),
  );

  const openRename = () => {
    setName(machine?.name ?? "");
    setError("");
    setView("rename");
  };

  const openWifiScan = () => {
    setSsid(machine?.wifi_ssid ?? "");
    setPassword("");
    setError("");
    setView("wifi-scan");
    startScan();
  };

  const handleDeviceConnect = async (device: any) => {
    const success = await connectToDevice(device);
    if (success) {
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setView("wifi-form");
    }
  };

  const handleAutoFillWifi = async () => {
    const currentSsid = await fetchWifi();
    if (currentSsid) {
      setSsid(currentSsid);
      setError("");
    }
  };

  const saveRename = () => {
    if (pending) return;
    const result = machineNameSchema.safeParse(name);
    if (!result.success) {
      setError(result.error.issues[0].message);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    setError("");
    rename.mutate(
      { id, name: result.data },
      {
        onSuccess: () => {
          if (Platform.OS !== "web") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          showToast("Machine name updated successfully.", "success");
          setView("menu");
        },
        onError: () => {
          showToast("Could not save changes. Please try again.", "error");
        },
      },
    );
  };

  const handleApplyWifiToHardware = async () => {
    if (pending) return;
    const result = machineSsidSchema.safeParse(ssid);
    if (!result.success) {
      setError(result.error.issues[0].message);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    if (!password.trim()) {
      setError("Wi-Fi Password is required");
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setError("");
    clearProvisioningError();
    setIsProvisioning(true);

    try {
      // 1. Write credentials to ESP32 over BLE and wait for connection test
      await provisionWifi(ssid.trim(), password);

      // 2. Sync new SSID with backend database
      await wifi.mutateAsync({ id, wifi_ssid: ssid.trim() });

      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      showToast("Wi-Fi credentials updated successfully!", "success");
      resetBle();
      setPassword("");
      setView("menu");
    } catch (err) {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect machine to Wi-Fi. Please check password.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsProvisioning(false);
    }
  };

  const disconnected = machine?.status === "offline";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        className="flex-row items-center gap-2 px-4 pb-6"
        style={{ paddingTop: Math.max(headerPaddingTop, 48) }}
      >
        <Pressable
          onPress={back}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityState={{ disabled: pending }}
          className="min-h-12 min-w-12 items-center justify-center -ml-3"
        >
          <ChevronLeft size={24} color={colors.semantic.foreground} />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-foreground">
          {view === "menu"
            ? "Machine Settings"
            : view === "rename"
              ? "Rename Machine"
              : view === "wifi-scan"
                ? "Select Machine to Re-configure"
                : "Change Wi-Fi Credentials"}
        </Text>
        {view === "rename" && (name.trim() !== machine?.name || error) && (
          <Pressable
            onPress={saveRename}
            disabled={pending}
            accessibilityRole="button"
            accessibilityState={{ disabled: pending, busy: pending }}
            className="min-h-12 min-w-12 items-center justify-center"
          >
            {pending ? (
              <ActivityIndicator color={colors.brand[500]} />
            ) : (
              <Text className="text-sm font-bold text-primary">Save</Text>
            )}
          </Pressable>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scrollPaddingBottom,
          flexGrow: 1,
        }}
      >
        {query.isError && (
          <HistoryState
            message={
              query.error?.message === "Machine not found"
                ? "This machine could not be found."
                : "Could not load machine settings."
            }
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}

        {query.isPending ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading machine settings"
            accessibilityState={{ busy: true }}
            className="gap-3"
          >
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-[60px] rounded-lg" />
            ))}
          </View>
        ) : (
          machine && (
            <>
              {view === "menu" && (
                <View className="gap-3">
                  <Pressable
                    accessibilityRole="button"
                    onPress={openRename}
                    className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4 bg-card active:bg-muted"
                  >
                    <PencilLine size={24} color={colors.semantic.foreground} />
                    <Text className="flex-1 text-sm font-sans text-foreground">
                      Rename machine
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={openWifiScan}
                    className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4 bg-card active:bg-muted"
                  >
                    <Wifi size={24} color={colors.semantic.foreground} />
                    <View className="flex-1">
                      <Text className="text-sm font-sans text-foreground">
                        Change Wi-Fi credentials
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        Requires Bluetooth to update hardware
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    disabled
                    accessibilityRole="button"
                    accessibilityState={{ disabled: true }}
                    accessibilityLabel="Remove current batch. Batch cancellation is not available yet."
                    className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4 opacity-50 bg-card"
                  >
                    <CompostIcon size={24} color={colors.red[500]} />
                    <Text className="flex-1 text-sm font-sans text-destructive">
                      Remove current batch
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setRemoveVisible(true)}
                    className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4 bg-card active:bg-muted"
                  >
                    <Trash2 size={24} color={colors.red[500]} />
                    <Text className="flex-1 text-sm font-sans text-destructive">
                      Remove machine
                    </Text>
                  </Pressable>
                </View>
              )}

              {view === "rename" && (
                <View className="mt-2">
                  <Input
                    label="Machine Name"
                    accessibilityLabel="Machine Name"
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      setError("");
                    }}
                    error={error}
                    editable={!pending}
                    controlClassName="rounded-[14px]"
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={saveRename}
                  />
                </View>
              )}

              {view === "wifi-scan" && (
                <View className="flex-1">
                  <View className="p-4 mb-4 bg-brand-50 border border-brand-200 rounded-2xl flex-row items-center gap-3">
                    <Info size={20} color="#718619" style={{ flexShrink: 0 }} />
                    <Text className="text-xs text-foreground flex-1 leading-relaxed">
                      Ensure your machine is nearby and in BLE provisioning mode
                      (hold BOOT button on ESP32 for 3s if not broadcasting).
                    </Text>
                  </View>

                  <ConnectStep
                    status={bleStatus}
                    devices={bleDevices}
                    connectedDevice={connectedDevice}
                    connectingDeviceId={connectingDeviceId}
                    errorMessage={bleErrorMessage}
                    onConnect={handleDeviceConnect}
                    onRetry={startScan}
                  />
                </View>
              )}

              {view === "wifi-form" && (
                <View className="flex-1 mt-2">
                  <View className="rounded-[14px] border border-border p-4 gap-2 mb-4 bg-card">
                    <Text className="text-xs text-muted-foreground">
                      Target Machine:
                    </Text>
                    <Text className="text-sm font-bold text-foreground">
                      {connectedDevice?.name || machine.name} (
                      {connectedDevice?.id || machine.mac_address})
                    </Text>
                  </View>

                  {pending && (
                    <View className="p-4 mb-4 bg-brand-50 border border-brand-200 rounded-2xl flex-row items-center gap-3">
                      <ActivityIndicator size="small" color="#718619" />
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                          Testing & connecting machine to Wi-Fi...
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Sending credentials to ESP32 over Bluetooth. This may
                          take 10–20 seconds.
                        </Text>
                      </View>
                    </View>
                  )}

                  {(error || provisioningError) && !pending && (
                    <View className="p-4 mb-4 bg-red-50 border border-destructive/20 rounded-2xl flex-row items-center gap-3">
                      <AlertCircle
                        size={20}
                        color="#E84C4C"
                        style={{ flexShrink: 0 }}
                      />
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-destructive">
                          Connection Failed
                        </Text>
                        <Text className="text-xs text-destructive mt-0.5 leading-relaxed">
                          {error || provisioningError}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="mb-4 flex-row justify-end">
                    <Button
                      title="Use Current Wi-Fi SSID"
                      variant="outline"
                      size="sm"
                      onPress={handleAutoFillWifi}
                      loading={isFetchingWifi}
                      disabled={pending || isFetchingWifi}
                      haptic
                    />
                  </View>

                  <Input
                    label="SSID"
                    placeholder="SSID"
                    accessibilityLabel="SSID"
                    value={ssid}
                    onChangeText={(value) => {
                      setSsid(value);
                      setError("");
                    }}
                    error={error && !password ? error : undefined}
                    editable={!pending}
                    autoCapitalize="none"
                    autoCorrect={false}
                    controlClassName="rounded-[14px]"
                  />

                  <Input
                    label="Wi-Fi Password"
                    placeholder="Wi-Fi Password"
                    accessibilityLabel="Wi-Fi Password"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setError("");
                    }}
                    isPassword
                    editable={!pending}
                    autoCapitalize="none"
                    autoCorrect={false}
                    controlClassName="rounded-[14px]"
                  />

                  <View className="mt-6">
                    <Button
                      title={
                        pending
                          ? "Connecting to Wi-Fi..."
                          : "Update Machine Wi-Fi"
                      }
                      loading={pending}
                      disabled={pending || !ssid.trim() || !password.trim()}
                      onPress={handleApplyWifiToHardware}
                      haptic
                    />
                  </View>
                </View>
              )}
            </>
          )
        )}
      </ScrollView>

      <ConfirmModal
        visible={removeVisible}
        title="Remove machine?"
        description="Are you sure you want to remove this machine from your barangay? You will no longer see it in your machines list."
        confirmText="Yes, remove it"
        isDestructive
        pending={remove.isPending}
        onCancel={() => {
          if (!remove.isPending) setRemoveVisible(false);
        }}
        onConfirm={() => {
          if (remove.isPending) return;
          remove.mutate(id, {
            onSuccess: () => {
              setRemoveVisible(false);
              router.dismissAll();
              router.replace("/(app)/(tabs)/machines");
            },
            onError: () =>
              showToast("Failed to remove machine. Please try again.", "error"),
          });
        }}
      />
    </KeyboardAvoidingView>
  );
}

