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
} from "lucide-react-native";
import {
  useMachine,
  useUpdateMachineName,
  useUpdateMachineWifi,
  useRemoveMachine,
} from "@/hooks/use-machines";
import { useDynamicLayout } from "@/hooks";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryState } from "@/components/history/history-state";
import { CompostIcon } from "@/components/icons";
import { colors } from "@/constants";
import { createLogger } from "@/lib/logger";
import { machineNameSchema, machineSsidSchema } from "@/lib/machine-overview";

const logger = createLogger("MachineSettingsScreen");
type SettingsView = "menu" | "rename" | "wifi";
export default function MachineSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { headerPaddingTop, scrollPaddingBottom } = useDynamicLayout();
  const { showToast } = useToast();
  const query = useMachine(id);
  const machine = query.data;
  const rename = useUpdateMachineName();
  const wifi = useUpdateMachineWifi();
  const remove = useRemoveMachine();
  const pending = rename.isPending || wifi.isPending || remove.isPending;
  const [view, setView] = useState<SettingsView>("menu");
  const [name, setName] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [removeVisible, setRemoveVisible] = useState(false);
  const back = useCallback(() => {
    if (pending) return;
    if (view === "menu") router.back();
    else {
      setView("menu");
      setPassword("");
      setError("");
    }
  }, [pending, view, router]);
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
  const open = (next: SettingsView) => {
    setName(machine?.name ?? "");
    setSsid(machine?.wifi_ssid ?? "");
    setPassword("");
    setError("");
    setView(next);
  };
  const save = () => {
    if (pending) return;
    const result = (
      view === "rename" ? machineNameSchema : machineSsidSchema
    ).safeParse(view === "rename" ? name : ssid);
    if (!result.success) {
      setError(result.error.issues[0].message);
      if (Platform.OS !== "web")
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError("");
    const callbacks = {
      onSuccess: () => {
        if (Platform.OS !== "web")
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        showToast(
          view === "rename"
            ? "Machine name updated successfully."
            : "Mock Wi-Fi name saved. Hardware credentials unchanged.",
          "success",
        );
        setPassword("");
        setView("menu");
      },
      onError: () => {
        showToast("Could not save changes. Please try again.", "error");
      },
    };
    if (view === "rename") rename.mutate({ id, name: result.data }, callbacks);
    else wifi.mutate({ id, wifi_ssid: result.data }, callbacks);
  };
  const dirty =
    view === "rename"
      ? name.trim() !== machine?.name
      : ssid.trim() !== (machine?.wifi_ssid ?? "") || password.length > 0;
  const disconnected = machine?.status === "offline";
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        className="flex-row items-center gap-2 px-4 pb-8"
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
              : "Change Wi-Fi Credentials"}
        </Text>
        {view !== "menu" && (dirty || error) && (
          <Pressable
            onPress={save}
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
          gap: 12,
        }}
      >
        {query.isError && (
          <HistoryState
            message={
              query.error.message === "Machine not found"
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
          machine &&
          (view === "menu" ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => open("rename")}
                className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4"
              >
                <PencilLine size={24} color={colors.semantic.foreground} />
                <Text className="flex-1 text-sm font-sans text-foreground">
                  Rename machine
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => open("wifi")}
                className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4"
              >
                <Wifi size={24} color={colors.semantic.foreground} />
                <Text className="flex-1 text-sm font-sans text-foreground">
                  Change Wi-Fi credentials
                </Text>
              </Pressable>
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                accessibilityLabel="Remove current batch. Batch cancellation is not available yet."
                className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4 opacity-50"
              >
                <CompostIcon size={24} color={colors.red[500]} />
                <Text className="flex-1 text-sm font-sans text-destructive">
                  Remove current batch
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRemoveVisible(true)}
                className="min-h-[60px] rounded-lg border border-border px-4 py-4 flex-row items-center gap-4"
              >
                <Trash2 size={24} color={colors.red[500]} />
                <Text className="flex-1 text-sm font-sans text-destructive">
                  Remove machine
                </Text>
              </Pressable>
            </>
          ) : view === "rename" ? (
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
              onSubmitEditing={save}
            />
          ) : (
            <>
              <View className="rounded-[14px] border border-border p-6 gap-2 mb-5">
                <Text className="text-sm font-bold text-foreground">
                  {machine.wifi_ssid || "No Wi-Fi configured"}
                </Text>
                <View className="flex-row items-center gap-2">
                  {disconnected ? (
                    <WifiOff size={18} color={colors.red[500]} />
                  ) : (
                    <Wifi size={18} color={colors.brand[500]} />
                  )}
                  <Text
                    className={`text-sm font-sans ${disconnected ? "text-destructive" : "text-primary"}`}
                  >
                    {disconnected
                      ? "Disconnected"
                      : machine.wifi_ssid
                        ? "Connected"
                        : "Not configured"}
                  </Text>
                </View>
              </View>
              <Input
                label="SSID"
                accessibilityLabel="SSID"
                value={ssid}
                onChangeText={(value) => {
                  setSsid(value);
                  setError("");
                }}
                error={error}
                editable={!pending}
                autoCapitalize="none"
                autoCorrect={false}
                controlClassName="rounded-[14px]"
              />
              <Input
                label="Wi-Fi Password"
                accessibilityLabel="Wi-Fi Password"
                value={password}
                onChangeText={setPassword}
                isPassword
                editable={!pending}
                autoCapitalize="none"
                autoCorrect={false}
                controlClassName="rounded-[14px]"
              />
              <Text className="text-xs font-sans text-foreground">
                Mock mode: only the Wi-Fi name is saved. Passwords are not
                stored or sent to the machine.
              </Text>
            </>
          ))
        )}
      </ScrollView>
      <ConfirmModal
        visible={removeVisible}
        title="Remove machine?"
        description="Remove this machine from the app's mock list? This does not stop hardware or remove recorded batch history."
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
