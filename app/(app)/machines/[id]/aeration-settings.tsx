import { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Fan,
  Settings2,
  Minus,
  Plus,
  Check,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
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

  // Editable picker values inside modal
  const [tempOnMinutes, setTempOnMinutes] = useState(config.onMinutes);
  const [tempOffMinutes, setTempOffMinutes] = useState(config.offMinutes);
  const [onInputText, setOnInputText] = useState(String(config.onMinutes));
  const [offInputText, setOffInputText] = useState(String(config.offMinutes));

  useEffect(() => {
    let isMounted = true;
    const remoteAeration = overview?.configuration?.aeration as
      | { mode?: "default" | "custom"; onMinutes?: number; offMinutes?: number }
      | undefined;

    if (
      remoteAeration &&
      (remoteAeration.mode === "default" || remoteAeration.mode === "custom") &&
      typeof remoteAeration.onMinutes === "number" &&
      typeof remoteAeration.offMinutes === "number"
    ) {
      const remoteConfig: AerationConfig = {
        mode: remoteAeration.mode,
        onMinutes: remoteAeration.onMinutes,
        offMinutes: remoteAeration.offMinutes,
      };
      setConfig(remoteConfig);
      if (!modalVisible) {
        setTempOnMinutes(remoteConfig.onMinutes);
        setTempOffMinutes(remoteConfig.offMinutes);
        setOnInputText(String(remoteConfig.onMinutes));
        setOffInputText(String(remoteConfig.offMinutes));
      }
      void setAerationConfig(id, remoteConfig);
      return;
    }

    void getAerationConfig(id).then((saved) => {
      if (isMounted) {
        setConfig(saved);
        if (!modalVisible) {
          setTempOnMinutes(saved.onMinutes);
          setTempOffMinutes(saved.offMinutes);
          setOnInputText(String(saved.onMinutes));
          setOffInputText(String(saved.offMinutes));
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id, modalVisible, overview?.configuration]);

  const handleSelectDefaultMode = useCallback(async () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!machine?.macAddress) {
      toast({
        title: "Device Unavailable",
        message: "Machine address is not available. Please try again when connected.",
        preset: "error",
      });
      return;
    }

    try {
      await deviceApi.sendCommand(machine.macAddress, {
        action: "AERATION_CONFIG",
        payload: { mode: "default" },
      });

      const updated: AerationConfig = {
        ...config,
        mode: "default",
      };
      setConfig(updated);
      await setAerationConfig(id, updated);

      toast({
        title: "Default Mode Selected",
        message: "Using standard SAGANA aeration settings.",
        preset: "done",
      });
      logger.info("Switched to default aeration mode", { machineId: id });
    } catch (err) {
      logger.warn("Failed to dispatch default AERATION_CONFIG to device", {
        err,
      });
      toast({
        title: "Update Failed",
        message: "Could not apply default settings to the machine. Please try again.",
        preset: "error",
      });
    }
  }, [config, id, machine?.macAddress]);

  const handleOpenCustomModal = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempOnMinutes(config.onMinutes);
    setTempOffMinutes(config.offMinutes);
    setOnInputText(String(config.onMinutes));
    setOffInputText(String(config.offMinutes));
    setModalVisible(true);
  }, [config.onMinutes, config.offMinutes]);

  const handleStepOn = useCallback((delta: number) => {
    setTempOnMinutes((prev) => {
      const next = Math.max(1, Math.min(180, prev + delta));
      setOnInputText(String(next));
      return next;
    });
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleStepOff = useCallback((delta: number) => {
    setTempOffMinutes((prev) => {
      const next = Math.max(1, Math.min(720, prev + delta));
      setOffInputText(String(next));
      return next;
    });
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleChangeOnInput = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setOnInputText(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setTempOnMinutes(Math.min(180, parsed));
    }
  }, []);

  const handleBlurOnInput = useCallback(() => {
    const parsed = parseInt(onInputText, 10);
    const clamped = Math.max(1, Math.min(180, Number.isFinite(parsed) ? parsed : 10));
    setTempOnMinutes(clamped);
    setOnInputText(String(clamped));
  }, [onInputText]);

  const handleChangeOffInput = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setOffInputText(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setTempOffMinutes(Math.min(720, parsed));
    }
  }, []);

  const handleBlurOffInput = useCallback(() => {
    const parsed = parseInt(offInputText, 10);
    const clamped = Math.max(1, Math.min(720, Number.isFinite(parsed) ? parsed : 5));
    setTempOffMinutes(clamped);
    setOffInputText(String(clamped));
  }, [offInputText]);

  const handleSaveCustomSettings = useCallback(async () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!machine?.macAddress) {
      toast({
        title: "Device Unavailable",
        message: "Machine address is not available. Please try again when connected.",
        preset: "error",
      });
      return;
    }

    const parsedOn = parseInt(onInputText, 10);
    const parsedOff = parseInt(offInputText, 10);
    const saveOn = Math.max(1, Math.min(180, Number.isFinite(parsedOn) ? parsedOn : tempOnMinutes));
    const saveOff = Math.max(1, Math.min(720, Number.isFinite(parsedOff) ? parsedOff : tempOffMinutes));

    try {
      await deviceApi.sendCommand(machine.macAddress, {
        action: "AERATION_CONFIG",
        payload: {
          mode: "custom",
          onMinutes: saveOn,
          offMinutes: saveOff,
        },
      });

      const updated: AerationConfig = {
        mode: "custom",
        onMinutes: saveOn,
        offMinutes: saveOff,
      };
      setConfig(updated);
      setModalVisible(false);
      await setAerationConfig(id, updated);

      toast({
        title: "Custom Mode Active",
        message: `${saveOn} min ON / ${saveOff} min OFF configured.`,
        preset: "done",
      });
      logger.info("Saved custom aeration settings", {
        machineId: id,
        onMinutes: saveOn,
        offMinutes: saveOff,
      });
    } catch (err) {
      logger.warn("Failed to dispatch custom AERATION_CONFIG to device", {
        err,
      });
      toast({
        title: "Update Failed",
        message: "Could not apply custom settings to the machine. Please try again.",
        preset: "error",
      });
    }
  }, [
    id,
    machine?.macAddress,
    onInputText,
    offInputText,
    tempOnMinutes,
    tempOffMinutes,
  ]);

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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace({
                  pathname: "/(app)/machines/[id]",
                  params: { id },
                });
              }
            }}
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
        <View className="rounded-2xl border border-border bg-card p-5 gap-3.5 mb-6">
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
            className={`rounded-2xl p-4 flex-row items-center justify-between mb-3 border ${
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
            className={`rounded-2xl p-4 border ${
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <Pressable
                className="flex-1"
                onPress={() => setModalVisible(false)}
              />
              <View className="bg-background rounded-t-3xl border-t border-border px-6 pt-3 pb-8">
                {/* Sheet Handle */}
                <View className="w-12 h-1 rounded-full bg-border self-center mb-5" />

                {/* Modal Header */}
                <Text className="text-base font-bold text-foreground mb-6">
                  Customize aeration mode
                </Text>

                {/* ON Duration Row */}
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm font-sans text-foreground">
                    ON Duration
                  </Text>
                  <View className="flex-row items-center bg-brand-100 rounded-full p-1.5 gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Decrease ON duration"
                      onPress={() => handleStepOn(-1)}
                      className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-80"
                    >
                      <Minus size={16} color={colors.semantic.primaryForeground} />
                    </Pressable>
                    <View className="flex-row items-center justify-center min-w-16 px-1">
                      <TextInput
                        value={onInputText}
                        onChangeText={handleChangeOnInput}
                        onBlur={handleBlurOnInput}
                        keyboardType="number-pad"
                        maxLength={3}
                        returnKeyType="done"
                        selectTextOnFocus
                        accessibilityLabel="ON duration in minutes"
                        className="text-sm font-bold text-foreground text-right min-w-6 py-0"
                      />
                      <Text className="text-sm font-bold text-foreground ml-1">
                        min
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Increase ON duration"
                      onPress={() => handleStepOn(1)}
                      className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-80"
                    >
                      <Plus size={16} color={colors.semantic.primaryForeground} />
                    </Pressable>
                  </View>
                </View>

                {/* OFF Duration Row */}
                <View className="flex-row items-center justify-between gap-3 mt-4">
                  <Text className="text-sm font-sans text-foreground">
                    OFF Duration
                  </Text>
                  <View className="flex-row items-center bg-brand-100 rounded-full p-1.5 gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Decrease OFF interval"
                      onPress={() => handleStepOff(-1)}
                      className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-80"
                    >
                      <Minus size={16} color={colors.semantic.primaryForeground} />
                    </Pressable>
                    <View className="flex-row items-center justify-center min-w-16 px-1">
                      <TextInput
                        value={offInputText}
                        onChangeText={handleChangeOffInput}
                        onBlur={handleBlurOffInput}
                        keyboardType="number-pad"
                        maxLength={3}
                        returnKeyType="done"
                        selectTextOnFocus
                        accessibilityLabel="OFF duration in minutes"
                        className="text-sm font-bold text-foreground text-right min-w-6 py-0"
                      />
                      <Text className="text-sm font-bold text-foreground ml-1">
                        min
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Increase OFF interval"
                      onPress={() => handleStepOff(1)}
                      className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-80"
                    >
                      <Plus size={16} color={colors.semantic.primaryForeground} />
                    </Pressable>
                  </View>
                </View>

                {/* Cycle Summary */}
                <Text className="text-sm font-bold text-primary text-center mt-6">
                  {tempOnMinutes} min ON - {tempOffMinutes} min OFF
                </Text>

                {/* Modal Action */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save and use custom mode"
                  onPress={handleSaveCustomSettings}
                  className="w-full min-h-12 rounded-full bg-primary items-center justify-center mt-5 active:opacity-85"
                >
                  <Text className="text-sm font-bold text-primary-foreground">
                    Save and use custom mode
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
