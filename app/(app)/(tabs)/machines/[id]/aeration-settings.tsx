import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Fan,
  Settings2,
  Minus,
  Plus,
  X,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { toast } from "burnt";
import { deviceApi } from "@/api/device.api";
import { useMachine, useMachineOverview } from "@/hooks/use-machines";
import { useDynamicLayout } from "@/hooks";
import { colors } from "@/constants";
import { createLogger } from "@/lib/logger";
import {
  AerationConfig,
  getCachedAerationConfig,
  getAerationConfig,
  setAerationConfig,
} from "@/lib/aeration-storage";

const logger = createLogger("AerationSettingsScreen");

export default function AerationSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { headerPaddingTop, scrollPaddingBottom } = useDynamicLayout();

  const machineQuery = useMachine(id);
  const overviewQuery = useMachineOverview(id);

  const machine = machineQuery.data;
  const overview = overviewQuery.data;

  const aerationAutomation = overview?.automations.find(
    (item) => item.kind === "aeration",
  );
  const isAerationOn = aerationAutomation?.enabled ?? true;

  const [config, setConfig] = useState<AerationConfig>(() =>
    getCachedAerationConfig(id),
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Temporary picker values inside modal
  const [tempOnMinutes, setTempOnMinutes] = useState(config.onMinutes);
  const [tempOffMinutes, setTempOffMinutes] = useState(config.offMinutes);

  useEffect(() => {
    let isMounted = true;
    void getAerationConfig(id).then((saved) => {
      if (isMounted) {
        setConfig(saved);
        setTempOnMinutes(saved.onMinutes);
        setTempOffMinutes(saved.offMinutes);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSelectDefaultMode = useCallback(async () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated: AerationConfig = {
      ...config,
      mode: "default",
    };
    setConfig(updated);
    await setAerationConfig(id, updated);

    if (machine?.macAddress) {
      try {
        await deviceApi.sendCommand(machine.macAddress, {
          action: "AERATION_CONFIG",
          payload: { mode: "default" },
        });
      } catch (err) {
        logger.warn("Failed to dispatch default AERATION_CONFIG to device", {
          err,
        });
      }
    }

    toast({
      title: "Default Mode Selected",
      message: "Using standard SAGANA aeration settings.",
      preset: "done",
    });
    logger.info("Switched to default aeration mode", { machineId: id });
  }, [config, id, machine?.macAddress]);

  const handleOpenCustomModal = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempOnMinutes(config.onMinutes);
    setTempOffMinutes(config.offMinutes);
    setModalVisible(true);
  }, [config.onMinutes, config.offMinutes]);

  const handleSaveCustomSettings = useCallback(async () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const updated: AerationConfig = {
      mode: "custom",
      onMinutes: tempOnMinutes,
      offMinutes: tempOffMinutes,
    };
    setConfig(updated);
    setModalVisible(false);
    await setAerationConfig(id, updated);

    if (machine?.macAddress) {
      try {
        await deviceApi.sendCommand(machine.macAddress, {
          action: "AERATION_CONFIG",
          payload: {
            mode: "custom",
            onMinutes: tempOnMinutes,
            offMinutes: tempOffMinutes,
          },
        });
      } catch (err) {
        logger.warn("Failed to dispatch custom AERATION_CONFIG to device", {
          err,
        });
      }
    }

    toast({
      title: "Custom Mode Active",
      message: `${tempOnMinutes} min ON / ${tempOffMinutes} min OFF configured.`,
      preset: "done",
    });
    logger.info("Saved custom aeration settings", {
      machineId: id,
      onMinutes: tempOnMinutes,
      offMinutes: tempOffMinutes,
    });
  }, [id, machine?.macAddress, tempOnMinutes, tempOffMinutes]);

  const isDefaultMode = config.mode === "default";
  const isCustomMode = config.mode === "custom";

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(headerPaddingTop, 24),
          paddingBottom: scrollPaddingBottom + 24,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="min-h-12 min-w-12 items-center justify-center -ml-3 active:opacity-75"
          >
            <ChevronLeft size={24} color={colors.semantic.foreground} />
          </Pressable>
          <Text className="text-xl font-bold text-foreground ml-1">
            Aeration Settings
          </Text>
        </View>

        {/* Current Overview Status Card */}
        <View className="rounded-[14px] border border-border bg-card p-5 gap-3.5 mb-6">
          {/* Machine Name */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-sans text-muted-foreground">
              Machine Name
            </Text>
            <Text className="text-sm font-bold text-foreground">
              {machine?.name ?? "SAGANA-1"}
            </Text>
          </View>

          {/* Current Aeration Status */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-sans text-muted-foreground">
              Current Aeration Status
            </Text>
            <Text
              className="text-sm font-bold"
              style={{
                color: isAerationOn ? colors.brand[500] : colors.gray.textIcon,
              }}
            >
              {isAerationOn ? "ON" : "OFF"}
            </Text>
          </View>

          {/* Current Aeration Mode */}
          <View className="flex-row items-start justify-between">
            <Text className="text-xs font-sans text-muted-foreground mt-0.5">
              Current Aeration Mode
            </Text>
            <View className="items-end">
              <Text className="text-sm font-bold text-foreground">
                {isDefaultMode ? "Default Mode" : "Custom Mode"}
              </Text>
              {isCustomMode && (
                <Text className="text-xs font-sans text-muted-foreground mt-0.5">
                  {config.onMinutes} min ON / {config.offMinutes} min OFF
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Section: Aeration Mode */}
        <View className="mb-4">
          <Text className="text-base font-bold text-foreground mb-3">
            Aeration Mode
          </Text>

          {/* Default Mode Card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Default Mode"
            accessibilityState={{ selected: isDefaultMode }}
            onPress={handleSelectDefaultMode}
            className={`rounded-[14px] p-4 flex-row items-center justify-between mb-3 border ${
              isDefaultMode
                ? "border-brand-500 bg-brand-50/50"
                : "border-border bg-card active:opacity-75"
            }`}
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDefaultMode ? "bg-brand-100" : "bg-neutral-100"
                }`}
              >
                <Fan
                  size={20}
                  color={
                    isDefaultMode ? colors.brand[500] : colors.gray.textIcon
                  }
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-bold ${
                    isDefaultMode ? "text-brand-900" : "text-foreground"
                  }`}
                >
                  Default Mode
                </Text>
                <Text className="text-xs font-sans text-muted-foreground mt-0.5 leading-4">
                  Use the default aeration settings by SAGANA
                </Text>
              </View>
            </View>
            {isDefaultMode && (
              <View className="w-6 h-6 rounded-full bg-brand-500 items-center justify-center">
                <Check size={14} color={colors.semantic.primaryForeground} />
              </View>
            )}
          </Pressable>

          {/* Custom Mode Card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Custom Mode"
            accessibilityState={{ selected: isCustomMode }}
            onPress={handleOpenCustomModal}
            className={`rounded-[14px] p-4 border ${
              isCustomMode
                ? "border-brand-500 bg-brand-50/50"
                : "border-border bg-card active:opacity-75"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isCustomMode ? "bg-brand-100" : "bg-neutral-100"
                  }`}
                >
                  <Settings2
                    size={20}
                    color={
                      isCustomMode ? colors.brand[500] : colors.gray.textIcon
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold ${
                      isCustomMode ? "text-brand-900" : "text-foreground"
                    }`}
                  >
                    Custom Mode
                  </Text>
                  <Text className="text-xs font-sans text-muted-foreground mt-0.5 leading-4">
                    Set a specific ON and OFF time for aeration
                  </Text>
                </View>
              </View>
              <ChevronRight
                size={20}
                color={
                  isCustomMode ? colors.brand[700] : colors.gray.textIcon
                }
              />
            </View>

            {/* When Custom Mode is active, show the current ON / OFF duration */}
            {isCustomMode && (
              <View className="mt-3 pt-3 border-t border-brand-200/60 flex-row items-center justify-between">
                <Text className="text-xs font-sans text-muted-foreground">
                  Configured Cycle:
                </Text>
                <Text className="text-xs font-bold text-brand-700">
                  {config.onMinutes} min ON / {config.offMinutes} min OFF
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Custom Duration & Interval Configuration Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setModalVisible(false)}
          />
          <View className="bg-background rounded-t-[24px] border-t border-border px-6 pt-5 pb-8">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-border">
              <View>
                <Text className="text-lg font-bold text-foreground">
                  Custom Aeration Mode
                </Text>
                <Text className="text-xs font-sans text-muted-foreground mt-0.5">
                  Set the duration and interval of the blower
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="w-10 h-10 items-center justify-center -mr-2 rounded-full active:bg-neutral-100"
              >
                <X size={20} color={colors.semantic.foreground} />
              </Pressable>
            </View>

            {/* ON Duration Section */}
            <View className="mt-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-foreground">
                  Blower ON Duration
                </Text>
                <Text className="text-xs font-sans text-muted-foreground">
                  Active aeration time
                </Text>
              </View>

              {/* Stepper Control */}
              <View className="flex-row items-center justify-between bg-card rounded-[14px] border border-border p-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease ON duration"
                  onPress={() => {
                    setTempOnMinutes((prev) => Math.max(1, prev - 1));
                    if (Platform.OS !== "web") {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center active:opacity-75"
                >
                  <Minus size={18} color={colors.semantic.foreground} />
                </Pressable>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-foreground">
                    {tempOnMinutes}
                  </Text>
                  <Text className="text-xs font-sans text-muted-foreground">
                    minutes ON
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase ON duration"
                  onPress={() => {
                    setTempOnMinutes((prev) => Math.min(60, prev + 1));
                    if (Platform.OS !== "web") {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center active:opacity-75"
                >
                  <Plus size={18} color={colors.semantic.foreground} />
                </Pressable>
              </View>

              {/* Quick Presets */}
              <View className="flex-row gap-2 mt-2">
                {[5, 10, 15, 20].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      setTempOnMinutes(preset);
                      if (Platform.OS !== "web") {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-full items-center border ${
                      tempOnMinutes === preset
                        ? "bg-brand-500 border-brand-500"
                        : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        tempOnMinutes === preset
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {preset}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* OFF Interval Section */}
            <View className="mt-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-foreground">
                  Blower OFF Interval
                </Text>
                <Text className="text-xs font-sans text-muted-foreground">
                  Rest interval between runs
                </Text>
              </View>

              {/* Stepper Control */}
              <View className="flex-row items-center justify-between bg-card rounded-[14px] border border-border p-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease OFF interval"
                  onPress={() => {
                    setTempOffMinutes((prev) => Math.max(1, prev - 1));
                    if (Platform.OS !== "web") {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center active:opacity-75"
                >
                  <Minus size={18} color={colors.semantic.foreground} />
                </Pressable>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-foreground">
                    {tempOffMinutes}
                  </Text>
                  <Text className="text-xs font-sans text-muted-foreground">
                    minutes OFF
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase OFF interval"
                  onPress={() => {
                    setTempOffMinutes((prev) => Math.min(120, prev + 1));
                    if (Platform.OS !== "web") {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center active:opacity-75"
                >
                  <Plus size={18} color={colors.semantic.foreground} />
                </Pressable>
              </View>

              {/* Quick Presets */}
              <View className="flex-row gap-2 mt-2">
                {[5, 10, 15, 30].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      setTempOffMinutes(preset);
                      if (Platform.OS !== "web") {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-full items-center border ${
                      tempOffMinutes === preset
                        ? "bg-brand-500 border-brand-500"
                        : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        tempOffMinutes === preset
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {preset}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Cycle Preview Badge */}
            <View className="mt-5 p-3.5 rounded-[14px] bg-brand-50 border border-brand-200 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Fan size={16} color={colors.brand[500]} />
                <Text className="text-xs font-sans text-brand-900">
                  Configured Cycle Preview:
                </Text>
              </View>
              <Text className="text-xs font-bold text-brand-700">
                {tempOnMinutes} min ON / {tempOffMinutes} min OFF
              </Text>
            </View>

            {/* Modal Actions */}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => setModalVisible(false)}
                className="flex-1 min-h-12 rounded-full border border-border items-center justify-center active:opacity-75"
              >
                <Text className="text-sm font-bold text-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save Settings"
                onPress={handleSaveCustomSettings}
                className="flex-1 min-h-12 rounded-full bg-primary items-center justify-center active:opacity-85"
              >
                <Text className="text-sm font-bold text-primary-foreground">
                  Save Settings
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
