import { View, Text, Pressable, useWindowDimensions } from "react-native";
import {
  ChevronRight,
  Radio,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Clock,
} from "lucide-react-native";
import { CompostIcon } from "@/components/icons";
import { colors } from "@/constants";
import type { Machine } from "@/types/machine";
import { formatTimeAgo } from "@/lib/utils";

interface MachineCardProps {
  machine: Machine;
  onPress: () => void;
}

export function MachineCard({ machine, onPress }: MachineCardProps) {
  const { width, fontScale } = useWindowDimensions();
  const wrapSensors = width < 360 || fontScale > 1.2;
  const isOffline = machine.status === "offline";
  const isVacant =
    machine.status === "maintenance" ||
    machine.status === "available" ||
    !machine.latest_readings;

  // Values
  const temp = isVacant ? "--" : `${machine.latest_readings?.temperature}°C`;
  const moisture = isVacant ? "--" : `${machine.latest_readings?.moisture}%`;
  const o2 = isVacant ? "--" : `${machine.latest_readings?.oxygen}%`;
  const co2 = isVacant ? "--" : `${machine.latest_readings?.co2}%`;

  // Colors
  const tempColor = isVacant
    ? colors.gray.textIcon
    : colors.sensors.temperature;
  const moistureColor = isVacant
    ? colors.gray.textIcon
    : colors.sensors.moisture;
  const o2Color = isVacant ? colors.gray.textIcon : colors.sensors.oxygen;
  const co2Color = isVacant
    ? colors.gray.textIcon
    : colors.sensors.carbonDioxide;

  // Footer
  const phaseText = isVacant ? "Vacant" : "Thermophilic Phase";
  const phaseColorClass = isVacant ? "text-muted-foreground" : "text-primary";
  const phaseIconColor = isVacant ? colors.gray.textIcon : colors.brand[500];
  const timeAgo = isVacant
    ? "--"
    : formatTimeAgo(machine.latest_readings?.updated_at);

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
          <Radio
            size={20}
            color={isOffline ? colors.gray.textIcon : colors.brand[500]}
          />
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
