import { View, Text, Pressable, useWindowDimensions } from "react-native";
import {
  ChevronRight,
  Radio,
  RadioOff,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Clock,
} from "lucide-react-native";
import { CompostIcon } from "@/components/icons";
import { colors } from "@/constants";
import type { CompostBatch } from "@/types/batch";
import { getMachineState } from "@/lib/machine-overview";
import type { Machine } from "@/types/machine";
import { formatTimeAgo } from "@/lib/utils";

interface MachineCardProps {
  machine: Machine;
  activeBatch: CompostBatch | null;
  onPress: () => void;
}

export function MachineCard({
  machine,
  activeBatch,
  onPress,
}: MachineCardProps) {
  const { width, fontScale } = useWindowDimensions();
  const wrapSensors = width < 360 || fontScale > 1.2;
  const { vacant: isVacant, disconnected: isOffline } = getMachineState(
    machine,
    activeBatch,
  );
  const temp =
    machine.latestReadings?.temperature == null
      ? "--"
      : `${machine.latestReadings.temperature}°C`;
  const moisture =
    machine.latestReadings?.moisture == null
      ? "--"
      : `${machine.latestReadings.moisture}%`;
  const o2 =
    machine.latestReadings?.oxygen == null
      ? "--"
      : `${machine.latestReadings.oxygen}%`;
  const co2 =
    machine.latestReadings?.co2 == null
      ? "--"
      : `${machine.latestReadings.co2}%`;

  const tempColor = temp === "--"
    ? colors.gray.textIcon
    : colors.sensors.temperature;
  const moistureColor = moisture === "--"
    ? colors.gray.textIcon
    : colors.sensors.moisture;
  const o2Color = o2 === "--" ? colors.gray.textIcon : colors.sensors.oxygen;
  const co2Color = co2 === "--"
    ? colors.gray.textIcon
    : colors.sensors.carbonDioxide;

  const phaseName = activeBatch?.compostingPhases?.findLast((item) => item.status === "active")?.phaseName;
  const phaseText = isVacant
    ? "Vacant"
    : phaseName || "Composting";
  const phaseColorClass = isVacant ? "text-muted-foreground" : "text-primary";
  const phaseIconColor = isVacant ? colors.gray.textIcon : colors.brand[500];
  const timeAgo = formatTimeAgo(machine.latestReadings?.updatedAt);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${machine.name}${isOffline ? ", offline" : ""}`}
      className="bg-card rounded-[14px] border border-border px-4 py-6"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 flex-row items-center gap-3">
          {isOffline ? (
            <RadioOff size={20} color={colors.red[500]} />
          ) : (
            <Radio size={20} color={colors.brand[500]} />
          )}
          <Text className="flex-1 text-[14px] font-bold text-foreground">
            {machine.name}
          </Text>
        </View>
        <ChevronRight
          size={20}
          color={colors.semantic.foreground}
          strokeWidth={2}
        />
      </View>

      {isOffline && (
        <Text className="mb-3 text-[12px] font-sans text-foreground">
          Offline · readings may be outdated
        </Text>
      )}

      {/* Sensor Grid */}
      <View className="flex-row flex-wrap justify-between mb-4 gap-2">
        {/* Temp */}
        <View
          style={{ flexBasis: wrapSensors ? "47%" : 0, flexGrow: 1 }}
          className="min-h-[99px] items-center justify-center border border-border rounded-[8px] px-1 py-3"
        >
          <Thermometer size={24} color={tempColor} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: tempColor }}>
            {temp}
          </Text>
          <Text className="text-[12px] font-sans text-foreground mt-0.5">
            Temp.
          </Text>
        </View>

        {/* Moisture */}
        <View
          style={{ flexBasis: wrapSensors ? "47%" : 0, flexGrow: 1 }}
          className="min-h-[99px] items-center justify-center border border-border rounded-[8px] px-1 py-3"
        >
          <Droplets size={24} color={moistureColor} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: moistureColor }}>
            {moisture}
          </Text>
          <Text className="text-[12px] font-sans text-foreground mt-0.5">
            Moisture
          </Text>
        </View>

        {/* O2 */}
        <View
          style={{ flexBasis: wrapSensors ? "47%" : 0, flexGrow: 1 }}
          className="min-h-[99px] items-center justify-center border border-border rounded-[8px] px-1 py-3"
        >
          <Wind size={24} color={o2Color} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: o2Color }}>
            {o2}
          </Text>
          <Text className="text-[12px] font-sans text-foreground mt-0.5">
            O2
          </Text>
        </View>

        {/* CO2 */}
        <View
          style={{ flexBasis: wrapSensors ? "47%" : 0, flexGrow: 1 }}
          className="min-h-[99px] items-center justify-center border border-border rounded-[8px] px-1 py-3"
        >
          <Cloud size={24} color={co2Color} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: co2Color }}>
            {co2}
          </Text>
          <Text className="text-[12px] font-sans text-foreground mt-0.5">
            CO2
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row flex-wrap items-center justify-between gap-3 pt-1">
        <View className="flex-row items-center gap-2">
          <CompostIcon size={18} color={phaseIconColor} />
          <Text className={`text-[13px] font-bold ${phaseColorClass}`}>
            {phaseText}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Clock size={14} color={colors.gray.textIcon} />
          <Text className="text-[13px] font-medium text-muted-foreground">
            {timeAgo}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
