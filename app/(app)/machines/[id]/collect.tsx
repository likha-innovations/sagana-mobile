import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useDynamicLayout } from "@/hooks/use-layout";
import { useMachine, useMachineOverview } from "@/hooks/use-machines";
import { useActiveBatch, useFinishCompostBatch } from "@/hooks/use-batches";
import { useSocket } from "@/hooks/use-socket";
import { deviceApi } from "@/api/device.api";
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

  const [floorState, setFloorState] = useState<FloorState>("lowered");
  const [hasEmptied, setHasEmptied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialWeight = overview?.currentWeight ?? activeBatch?.totalWeight ?? null;
  const displayWeight = hasEmptied ? "0 kg" : initialWeight != null ? `${initialWeight} kg` : "--";

  const isReject = mode === "reject";
  const title = isReject ? "Reject current batch" : "Collect your curing-ready compost";
  const description = isReject
    ? "Press the button below to raise the floor of the machine, and click next once you're done."
    : "Press the button below to raise the floor of the machine, and click next once you're done.";

  const isMoving = floorState === "raising" || floorState === "dropping";
  const isFloorRaised = floorState === "raised";

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

  // Listen for hardware telemetry confirming actuator reached limit and stopped
  useEffect(() => {
    if (!isMoving || !latestTelemetry) return;
    const actObj = (latestTelemetry as Record<string, unknown>).actuators as
      | Record<string, unknown>
      | undefined;
    if (actObj?.linear_actuator === "STOPPED") {
      if (floorState === "raising") {
        setFloorState("raised");
        setHasEmptied(true);
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } else if (floorState === "dropping") {
        setFloorState("lowered");
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    }
  }, [isMoving, latestTelemetry, floorState]);

  // Fallback timer ensures movement completes if telemetry is offline or delayed
  useEffect(() => {
    if (!isMoving) return;

    const timer = setTimeout(() => {
      if (floorState === "raising") {
        setFloorState("raised");
        setHasEmptied(true);
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } else if (floorState === "dropping") {
        setFloorState("lowered");
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isMoving, floorState]);

  const handleActuatorToggle = useCallback(async () => {
    if (isMoving) return;

    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!isFloorRaised) {
      setFloorState("raising");
      if (machine?.macAddress) {
        try {
          await deviceApi.sendCommand(machine.macAddress, { action: "ACTUATOR_EXTEND" });
        } catch (err) {
          logger.warn("Failed to dispatch ACTUATOR_EXTEND", err);
        }
      }
    } else {
      setFloorState("dropping");
      if (machine?.macAddress) {
        try {
          await deviceApi.sendCommand(machine.macAddress, { action: "ACTUATOR_RETRACT" });
        } catch (err) {
          logger.warn("Failed to dispatch ACTUATOR_RETRACT", err);
        }
      }
    }
  }, [isMoving, isFloorRaised, machine?.macAddress]);

  const handleNext = useCallback(() => {
    if (!hasEmptied || isMoving || finishBatch.isPending) return;

    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (activeBatch?.id) {
      const finalWeight = isReject ? 0 : (initialWeight ?? undefined);
      finishBatch.mutate(
        { id: activeBatch.id, finalWeight },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["machine-overview", id] });
            setIsSuccess(true);
          },
          onError: () => {
            // Display success screen locally if offline or already finalized
            setIsSuccess(true);
          },
        },
      );
    } else {
      setIsSuccess(true);
    }
  }, [hasEmptied, isMoving, finishBatch, activeBatch?.id, isReject, initialWeight, queryClient, id]);

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
          onPress={() => !isMoving && router.back()}
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
        <View className="rounded-[14px] border border-border bg-card p-6 items-center justify-center">
          <Text className="text-2xl font-bold text-foreground">{displayWeight}</Text>
          <Text className="text-xs font-sans text-muted-foreground mt-1">Current weight</Text>
        </View>

        {/* Linear actuator manual control button */}
        <View className="items-center mt-6">
          <Pressable
            disabled={isMoving}
            accessibilityRole="button"
            accessibilityLabel={getActuatorButtonText()}
            accessibilityState={{ disabled: isMoving }}
            onPress={handleActuatorToggle}
            className="min-w-[150px] min-h-[44px] px-8 rounded-full border border-brand-500 items-center justify-center active:opacity-75"
          >
            {isMoving ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.brand[500]} />
                <Text className="text-sm font-bold text-brand-700">{getActuatorButtonText()}</Text>
              </View>
            ) : (
              <Text className="text-sm font-bold text-brand-700">{getActuatorButtonText()}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Next button pinned to bottom */}
      <Pressable
        disabled={!hasEmptied || isMoving || finishBatch.isPending}
        accessibilityRole="button"
        accessibilityLabel="Next"
        accessibilityState={{ disabled: !hasEmptied || isMoving || finishBatch.isPending }}
        onPress={handleNext}
        className={`min-h-12 rounded-full items-center justify-center ${
          hasEmptied && !isMoving && !finishBatch.isPending
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
