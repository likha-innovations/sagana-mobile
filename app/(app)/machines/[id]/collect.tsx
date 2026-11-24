import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, AlertCircle, CheckCircle2, WifiOff } from "lucide-react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { toast } from "burnt";
import { useQueryClient } from "@tanstack/react-query";
import { useDynamicLayout } from "@/hooks/use-layout";
import { useMachine, useMachineOverview } from "@/hooks/use-machines";
import { useActiveBatch, useFinishCompostBatch } from "@/hooks/use-batches";
import { useSocket } from "@/hooks/use-socket";
import { getSocket } from "@/lib/socket";
import { deviceApi } from "@/api/device.api";
import {
  getCachedFloorPosition,
  getFloorPosition,
  setFloorPosition,
} from "@/lib/actuator-storage";
import { colors } from "@/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("LinearActuatorCollectScreen");

type FloorState = "lowered" | "raising" | "raised" | "dropping";

export default function LinearActuatorCollectScreen() {
  const { id, mode = "collect" } = useLocalSearchParams<{
    id: string;
    mode?: "collect" | "reject";
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { headerPaddingTop, stackScrollPadding } = useDynamicLayout();

  const machineQuery = useMachine(id);
  const batchQuery = useActiveBatch(id);
  const overviewQuery = useMachineOverview(id);
  const finishBatch = useFinishCompostBatch();

  const machine = machineQuery.data;
  const activeBatch = batchQuery.data;
  const overview = overviewQuery.data;
  const { latestTelemetry } = useSocket();

  const telemObj = latestTelemetry as Record<string, unknown> | null;
  const isTelemForThisMachine =
    telemObj != null &&
    ((typeof telemObj.machineId === "string" && telemObj.machineId === id) ||
      (typeof telemObj.macAddress === "string" &&
        machine?.macAddress &&
        telemObj.macAddress === machine.macAddress));

  const cachedFloorPos = getCachedFloorPosition(id);
  const actObj = isTelemForThisMachine
    ? (telemObj?.actuators as Record<string, unknown> | undefined)
    : undefined;
  const doorsObj = isTelemForThisMachine
    ? (telemObj?.doors as Record<string, unknown> | undefined)
    : undefined;

  const initialFloorPosition = actObj?.actuator_position as string | undefined;
  const isInitiallyRaised = initialFloorPosition === "RAISED" || cachedFloorPos === "raised";

  const [floorState, setFloorState] = useState<FloorState>(() =>
    isInitiallyRaised ? "raised" : "lowered",
  );
  const lastConfirmedPositionRef = useRef<"raised" | "lowered">(
    isInitiallyRaised ? "raised" : "lowered",
  );
  const [hasEmptied, setHasEmptied] = useState(() => isInitiallyRaised);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialMiddleDoorOpen =
    doorsObj?.middle_door_closed !== undefined ? !doorsObj.middle_door_closed : false;
  const [isMiddleDoorOpen, setIsMiddleDoorOpen] = useState(initialMiddleDoorOpen);

  const initialWeight = overview?.currentWeight ?? activeBatch?.totalWeight ?? null;
  const [snapshotWeight, setSnapshotWeight] = useState<number | null>(() => {
    return typeof initialWeight === "number" && initialWeight > 0 ? initialWeight : null;
  });

  useEffect(() => {
    if (!hasEmptied && snapshotWeight === null) {
      const w = overview?.currentWeight ?? activeBatch?.totalWeight ?? null;
      if (typeof w === "number" && w > 0) {
        setSnapshotWeight(w);
      }
    }
  }, [hasEmptied, snapshotWeight, overview?.currentWeight, activeBatch?.totalWeight]);

  const displayWeight = hasEmptied
    ? "0 kg"
    : snapshotWeight != null
      ? `${snapshotWeight} kg`
      : initialWeight != null
        ? `${initialWeight} kg`
        : "--";

  const isReject = mode === "reject";
  const title = isReject ? "Reject current batch" : "Collect your curing-ready compost";
  const description = isReject
    ? "Press the button below to raise the floor of the machine, and click next once you're done."
    : "Press the button below to raise the floor of the machine, and click next once you're done.";

  const isMachineOffline = machine?.status === "offline";
  const isMoving = floorState === "raising" || floorState === "dropping";
  const isFloorRaised = floorState === "raised";
  const isRaiseDisabled = !isFloorRaised && !isMiddleDoorOpen;
  const isButtonDisabled = isMoving || isRaiseDisabled || isMachineOffline;

  const lastActionTime = useRef<number>(0);
  const ackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonically increasing command sequence — catch blocks check this to avoid
  // acting on a stale rejection from an earlier overlapping sendCommand call.
  const cmdSeqRef = useRef<number>(0);

  // Clean up acknowledgment timeout on unmount
  useEffect(() => {
    return () => {
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current);
      }
    };
  }, []);

  // Restore persisted floor position asynchronously from hardware storage
  useEffect(() => {
    let isMounted = true;
    void getFloorPosition(id).then((savedPos) => {
      if (!isMounted) return;
      if (savedPos === "raised") {
        lastConfirmedPositionRef.current = "raised";
        setFloorState((prev) => (prev === "lowered" ? "raised" : prev));
        setHasEmptied(true);
      } else if (savedPos === "lowered") {
        lastConfirmedPositionRef.current = "lowered";
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Block Android hardware back button during actuator movement
  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (isMoving) {
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }
  }, [isMoving]);

  // Instant response: Listen for firmware automation events (remote or physical button)
  useEffect(() => {
    const socket = getSocket();

    const handleAutomationLog = (data: unknown) => {
      const log = data as { type?: string; message?: string; machineId?: string; macAddress?: string };
      const isCurrentMachine =
        (log.machineId && log.machineId === id) ||
        (machine?.macAddress && log.macAddress === machine.macAddress);

      if (!isCurrentMachine) return;

      lastActionTime.current = Date.now();

      if (log.type === "middle_door_opened") {
        setIsMiddleDoorOpen(true);
      } else if (log.type === "middle_door_closed") {
        setIsMiddleDoorOpen(false);
      } else if (log.type === "actuator_extending") {
        if (ackTimeoutRef.current) {
          clearTimeout(ackTimeoutRef.current);
          ackTimeoutRef.current = null;
        }
        setFloorState("raising");
      } else if (log.type === "actuator_retracting") {
        if (ackTimeoutRef.current) {
          clearTimeout(ackTimeoutRef.current);
          ackTimeoutRef.current = null;
        }
        setFloorState("dropping");
      } else if (log.type === "manual_command_rejected") {
        if (ackTimeoutRef.current) {
          clearTimeout(ackTimeoutRef.current);
          ackTimeoutRef.current = null;
        }
        setFloorState(lastConfirmedPositionRef.current);
        toast({
          title: "Command rejected",
          message: log.message ?? "The machine could not perform this operation safely.",
          preset: "error",
        });
      } else if (log.type === "actuator_extended") {
        if (ackTimeoutRef.current) {
          clearTimeout(ackTimeoutRef.current);
          ackTimeoutRef.current = null;
        }
        lastConfirmedPositionRef.current = "raised";
        setFloorState("raised");
        setHasEmptied(true);
        void setFloorPosition(id, "raised");
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } else if (log.type === "actuator_retracted") {
        if (ackTimeoutRef.current) {
          clearTimeout(ackTimeoutRef.current);
          ackTimeoutRef.current = null;
        }
        lastConfirmedPositionRef.current = "lowered";
        setFloorState("lowered");
        void setFloorPosition(id, "lowered");
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    };

    socket.on("automation_log", handleAutomationLog);
    return () => {
      socket.off("automation_log", handleAutomationLog);
    };
  }, [id, machine?.macAddress]);

  // Secondary stream: Telemetry synchronization (e.g. after network reconnection)
  useEffect(() => {
    if (!latestTelemetry) return;

    const telemData = latestTelemetry as Record<string, unknown>;
    const isCurrentMachine =
      (typeof telemData.machineId === "string" && telemData.machineId === id) ||
      (typeof telemData.macAddress === "string" &&
        machine?.macAddress &&
        telemData.macAddress === machine.macAddress);

    if (!isCurrentMachine) return;

    const doors = telemData.doors as Record<string, unknown> | undefined;
    if (doors?.middle_door_closed !== undefined) {
      setIsMiddleDoorOpen(!doors.middle_door_closed);
    }

    if (isMoving) return;
    if (Date.now() - lastActionTime.current < 5000) return;

    const act = telemData.actuators as Record<string, unknown> | undefined;
    const actState = act?.linear_actuator as string | undefined;
    const actPos = act?.actuator_position as string | undefined;

    if (actState === "EXTENDING") {
      setFloorState("raising");
    } else if (actState === "RETRACTING") {
      setFloorState("dropping");
    } else if (actPos === "RAISED" && floorState !== "raised") {
      lastConfirmedPositionRef.current = "raised";
      setFloorState("raised");
      setHasEmptied(true);
      void setFloorPosition(id, "raised");
    } else if (actPos === "LOWERED" && floorState !== "lowered") {
      lastConfirmedPositionRef.current = "lowered";
      setFloorState("lowered");
      void setFloorPosition(id, "lowered");
    }
  }, [isMoving, latestTelemetry, floorState, id, machine?.macAddress]);

  // Calibrated watchdog (19s): Safety fallback matching physical 17.5-18s stroke
  useEffect(() => {
    if (!isMoving) return;

    const watchdog = setTimeout(() => {
      lastActionTime.current = Date.now();
      // Watchdog expired without hardware confirmation — revert to last confirmed position
      // so the user can retry rather than showing a false completed state.
      setFloorState(lastConfirmedPositionRef.current);
      toast({
        title: "No confirmation received",
        message: "The machine did not confirm the move completed. Check the machine and try again.",
        preset: "error",
      });
    }, 19000);

    return () => clearTimeout(watchdog);
  }, [isMoving, floorState, id]);

  const handleActuatorToggle = useCallback(async () => {
    if (isButtonDisabled) return;

    if (isMachineOffline) {
      toast({
        title: "Machine is offline",
        message: "Cannot operate the floor while the machine is disconnected from Wi-Fi.",
        preset: "error",
      });
      return;
    }

    if (!machine?.macAddress) {
      toast({
        title: "Missing device address",
        message: "Could not identify machine device address.",
        preset: "error",
      });
      return;
    }

    lastActionTime.current = Date.now();

    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const targetFloorState: FloorState = isFloorRaised ? "dropping" : "raising";
    const revertFloorState: FloorState = lastConfirmedPositionRef.current;
    const commandAction = isFloorRaised ? "ACTUATOR_RETRACT" : "ACTUATOR_EXTEND";

    setFloorState(targetFloorState);

    // 4-second acknowledgment timeout guard:
    // If the machine does not respond with actuator_extending/retracting within 4 seconds,
    // cancel loading, revert state, and notify the user.
    if (ackTimeoutRef.current) {
      clearTimeout(ackTimeoutRef.current);
    }
    ackTimeoutRef.current = setTimeout(() => {
      ackTimeoutRef.current = null;
      setFloorState(revertFloorState);
      toast({
        title: "Machine did not respond",
        message: "The machine did not receive the instruction. Please ensure it is powered on and connected to Wi-Fi.",
        preset: "error",
      });
    }, 4000);

    // Stamp this invocation so a stale catch from a concurrent call cannot interfere.
    cmdSeqRef.current += 1;
    const thisCmdSeq = cmdSeqRef.current;

    try {
      await deviceApi.sendCommand(machine.macAddress, { action: commandAction });
    } catch (err) {
      // Ignore rejections from superseded invocations — the newer command owns timer and state.
      if (cmdSeqRef.current !== thisCmdSeq) return;
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current);
        ackTimeoutRef.current = null;
      }
      setFloorState(revertFloorState);
      logger.warn(`Failed to dispatch ${commandAction}`, err);
      toast({
        title: "Command failed",
        message: "Could not send instruction to server. Please check your internet connection.",
        preset: "error",
      });
    }
  }, [isButtonDisabled, isMachineOffline, machine?.macAddress, isFloorRaised]);

  const handleNext = useCallback(() => {
    if (
      !hasEmptied ||
      isMoving ||
      finishBatch.isPending ||
      batchQuery.isPending
    ) {
      return;
    }

    if (!activeBatch?.id) {
      toast({
        title: "No Active Batch",
        message: "No active batch was found to finalize.",
        preset: "error",
      });
      return;
    }

    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const finalWeight = isReject
      ? 0
      : (snapshotWeight ??
        overview?.currentWeight ??
        activeBatch.totalWeight ??
        undefined);

    finishBatch.mutate(
      { id: activeBatch.id, finalWeight },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: ["machine-overview", id],
          });
          setIsSuccess(true);
        },
        onError: (err) => {
          logger.warn("Failed to finalize batch", err);
          toast({
            title: "Finalization Failed",
            message:
              err instanceof Error
                ? err.message
                : "Could not complete batch. Please try again.",
            preset: "error",
          });
        },
      },
    );
  }, [
    hasEmptied,
    isMoving,
    finishBatch,
    batchQuery.isPending,
    activeBatch,
    isReject,
    snapshotWeight,
    overview?.currentWeight,
    queryClient,
    id,
  ]);

  const handleDone = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/(app)/(tabs)/machines");
  }, [router]);

  if (isSuccess) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-between"
        style={{
          paddingTop: Math.max(headerPaddingTop, 48),
          paddingBottom: stackScrollPadding,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("@/assets/icons/mascot/sagana_celebrate.png")}
            style={{ width: 280, height: 220 }}
            contentFit="contain"
          />
          <Text className="text-xl font-bold text-foreground text-center mt-6">
            {isReject ? "Compost batch rejected" : "Compost batch completed!"}
          </Text>
          <Text className="text-sm font-sans text-muted-foreground text-center mt-2 px-4 leading-5">
            {isReject
              ? "You can now view this batch in the history tab in this app. The machine chamber is now vacant."
              : "You can now view this batch in the history tab in this app. Congrats on your new curing-ready compost!"}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={handleDone}
          className="min-h-12 rounded-full bg-primary px-6 items-center justify-center active:opacity-85"
        >
          <Text className="text-sm font-bold text-primary-foreground">Done</Text>
        </Pressable>
      </View>
    );
  }

  const getActuatorButtonText = () => {
    switch (floorState) {
      case "raising":
        return "Raising floor..";
      case "raised":
        return "Drop floor";
      case "dropping":
        return "Dropping floor..";
      case "lowered":
      default:
        return "Raise floor";
    }
  };

  return (
    <View
      className="flex-1 bg-background px-4 justify-between"
      style={{
        paddingTop: Math.max(headerPaddingTop, 32),
        paddingBottom: stackScrollPadding,
      }}
    >
      <View>
        {/* Header */}
        <Pressable
          disabled={isMoving}
          onPress={() => {
            if (isMoving) return;
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
          className={`min-h-12 min-w-12 items-center justify-center -ml-3 self-start ${
            isMoving ? "opacity-30" : "active:opacity-75"
          }`}
        >
          <ChevronLeft size={24} color={colors.semantic.foreground} />
        </Pressable>

        {/* Title & Description */}
        <View className="mt-2 mb-6">
          <Text className="text-xl font-bold text-foreground">{title}</Text>
          <Text className="text-sm font-sans text-muted-foreground mt-2 leading-5">
            {description}
          </Text>
        </View>

        {/* Weight display card */}
        <View className="rounded-2xl border border-border bg-card p-6 items-center justify-center">
          <Text className="text-2xl font-bold text-foreground">{displayWeight}</Text>
          <Text className="text-xs font-sans text-muted-foreground mt-1">Current weight</Text>
        </View>

        {/* Floor & Middle Door status card */}
        <View className="mt-4 rounded-2xl border border-border bg-card p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className={`w-3 h-3 rounded-full ${
                isMoving ? "bg-brand-500" : isFloorRaised ? "bg-brand-500" : "bg-neutral-300"
              }`}
            />
            <View>
              <Text className="text-xs font-sans text-muted-foreground">Floor state</Text>
              <Text className="text-sm font-bold text-foreground">
                {isMoving
                  ? floorState === "raising"
                    ? "Raising floor..."
                    : "Dropping floor..."
                  : isFloorRaised
                  ? "Floor is opened (raised)"
                  : "Floor is closed (lowered)"}
              </Text>
            </View>
          </View>

          {/* Middle Door indicator badge */}
          <View
            className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isMiddleDoorOpen
                ? "bg-brand-50 border border-brand-200"
                : "bg-neutral-100 border border-border"
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full ${
                isMiddleDoorOpen ? "bg-brand-500" : "bg-neutral-400"
              }`}
            />
            <Text
              className={`text-xs font-semibold ${
                isMiddleDoorOpen ? "text-brand-700" : "text-neutral-600"
              }`}
            >
              Middle door: {isMiddleDoorOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>

        {/* Machine Offline notice callout */}
        {isMachineOffline && (
          <View className="mt-3 p-4 rounded-2xl bg-red-50 border border-red-200 flex-row items-start gap-3">
            <WifiOff size={20} color={colors.red[500]} style={{ marginTop: 2, flexShrink: 0 }} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-red-900">Machine is offline</Text>
              <Text className="text-xs font-sans text-red-700 mt-1 leading-5">
                The machine is currently disconnected from Wi-Fi. Please check its power and network connection to operate the floor.
              </Text>
            </View>
          </View>
        )}

        {/* Actionable door & floor notice callout */}
        {!isMachineOffline && !isFloorRaised && !isMiddleDoorOpen && (
          <View className="mt-3 p-4 rounded-2xl bg-yellow-50 border border-yellow-200 flex-row items-start gap-3">
            <AlertCircle size={20} color={colors.yellow[700]} style={{ marginTop: 2, flexShrink: 0 }} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-neutral-900">Middle door is closed</Text>
              <Text className="text-xs font-sans text-neutral-700 mt-1 leading-5">
                The chamber floor cannot be raised while the middle compost door is closed. Please open the middle door on the machine to proceed.
              </Text>
            </View>
          </View>
        )}

        {!isMachineOffline && !isFloorRaised && isMiddleDoorOpen && (
          <View className="mt-3 p-4 rounded-2xl bg-brand-50 border border-brand-200 flex-row items-start gap-3">
            <CheckCircle2 size={20} color={colors.brand[500]} style={{ marginTop: 2, flexShrink: 0 }} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-brand-900">Ready to raise floor</Text>
              <Text className="text-xs font-sans text-brand-700 mt-1 leading-5">
                Middle door is open. You can now press &quot;Raise floor&quot; to empty the curing-ready compost.
              </Text>
            </View>
          </View>
        )}

        {!isMachineOffline && isFloorRaised && (
          <View className="mt-3 p-4 rounded-2xl bg-brand-50 border border-brand-200 flex-row items-start gap-3">
            <CheckCircle2 size={20} color={colors.brand[500]} style={{ marginTop: 2, flexShrink: 0 }} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-brand-900">Floor is raised</Text>
              <Text className="text-xs font-sans text-brand-700 mt-1 leading-5">
                The chamber floor is currently raised. Once compost collection is complete, press &quot;Drop floor&quot;.
              </Text>
            </View>
          </View>
        )}

        {/* Linear actuator manual control button */}
        <View className="items-center mt-6">
          <Pressable
            disabled={isButtonDisabled}
            accessibilityRole="button"
            accessibilityLabel={getActuatorButtonText()}
            accessibilityState={{ disabled: isButtonDisabled }}
            onPress={handleActuatorToggle}
            className={`min-w-37.5 min-h-11 px-8 rounded-full border items-center justify-center ${
              isButtonDisabled && !isMoving
                ? "border-neutral-200 bg-neutral-100 opacity-60"
                : "border-brand-500 active:opacity-75"
            }`}
          >
            {isMoving ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.brand[500]} />
                <Text className="text-sm font-bold text-brand-700">{getActuatorButtonText()}</Text>
              </View>
            ) : (
              <Text
                className={`text-sm font-bold ${
                  isButtonDisabled ? "text-neutral-400" : "text-brand-700"
                }`}
              >
                {isMachineOffline && !isMoving ? "Machine offline" : getActuatorButtonText()}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Next button pinned to bottom */}
      <Pressable
        disabled={
          !hasEmptied ||
          isMoving ||
          finishBatch.isPending ||
          batchQuery.isPending ||
          !activeBatch
        }
        accessibilityRole="button"
        accessibilityLabel="Next"
        accessibilityState={{
          disabled:
            !hasEmptied ||
            isMoving ||
            finishBatch.isPending ||
            batchQuery.isPending ||
            !activeBatch,
        }}
        onPress={handleNext}
        className={`min-h-12 rounded-full items-center justify-center ${
          hasEmptied &&
          !isMoving &&
          !finishBatch.isPending &&
          !batchQuery.isPending &&
          activeBatch
            ? "bg-primary active:opacity-85"
            : "bg-brand-200 opacity-60"
        }`}
      >
        {finishBatch.isPending ? (
          <ActivityIndicator size="small" color={colors.semantic.primaryForeground} />
        ) : (
          <Text className="text-sm font-bold text-primary-foreground">Next</Text>
        )}
      </Pressable>
    </View>
  );
}
