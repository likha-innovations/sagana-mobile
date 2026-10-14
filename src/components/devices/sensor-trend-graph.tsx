import { useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { LineChart, type lineDataItem } from "react-native-gifted-charts";
import type { ChartPoint } from "@/lib/history";
import { colors } from "@/constants/colors";

interface SensorTrendGraphProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  points: ChartPoint[];
  unit: string;
  maxVal: number;
}

export function SensorTrendGraph({
  title,
  icon: Icon,
  iconColor,
  points,
  unit,
  maxVal,
}: SensorTrendGraphProps) {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const labelWidth = 64 * fontScale;
  const chartWidth = Math.max(1, width - 60 * fontScale);
  const spacing =
    Math.max(0, chartWidth - labelWidth) / Math.max(1, points.length - 1);
  const values = points.flatMap((point) =>
    point.value === null ? [] : [point.value],
  );
  const formatValue = (value: number) => `${Number(value.toFixed(3))}${unit}`;
  const middle = Math.floor((points.length - 1) / 2);
  const data: lineDataItem[] = points.map((point, index) => ({
    value: point.value ?? undefined,
    label:
      index === 0 ||
      index === points.length - 1 ||
      (fontScale <= 1.2 && index === middle)
        ? point.label
        : "",
  }));
  const stepValue = maxVal / 4;
  const belowZero = Math.ceil(Math.abs(Math.min(0, ...values)) / stepValue);

  return (
    <View className="bg-card rounded-[14px] border border-border px-4 py-5 gap-4">
      <View className="flex-row items-center gap-2">
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
        <Text className="flex-1 text-base font-bold text-foreground">
          {title}
        </Text>
        <Text className="text-sm font-sans text-foreground">{unit}</Text>
      </View>
      {values.length === 0 ? (
        <Text className="py-6 text-sm font-sans text-foreground">
          No readings recorded for this sensor.
        </Text>
      ) : (
        <>
          <View
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${title}. ${values.length} recorded intervals. Minimum ${formatValue(Math.min(...values))}, maximum ${formatValue(Math.max(...values))}.`}
          >
            {width > 0 && (
              <LineChart
                data={data}
                width={chartWidth}
                height={176}
                spacing={spacing}
                initialSpacing={labelWidth / 2}
                endSpacing={labelWidth / 2}
                disableScroll
                color={iconColor}
                thickness={2}
                dataPointsColor={iconColor}
                dataPointsRadius={2.5}
                interpolateMissingValues={false}
                extrapolateMissingValues={false}
                maxValue={maxVal}
                noOfSections={4}
                stepValue={stepValue}
                noOfSectionsBelowXAxis={belowZero}
                yAxisThickness={0}
                xAxisThickness={0}
                yAxisLabelWidth={44 * fontScale}
                yAxisTextStyle={{
                  color: colors.semantic.foreground,
                  fontSize: 11,
                  fontFamily: "SpotifyMix-Regular",
                }}
                xAxisLabelTextStyle={{
                  color: colors.semantic.foreground,
                  fontSize: 11,
                  fontFamily: "SpotifyMix-Regular",
                  width: labelWidth,
                  marginLeft: (spacing - labelWidth) / 2,
                }}
                xAxisTextNumberOfLines={1}
                xAxisLabelsHeight={24 * fontScale}
                labelsExtraHeight={16 * fontScale}
                formatYLabel={(label) =>
                  String(Number(Number(label).toFixed(3)))
                }
                showFractionalValues
                roundToDigits={3}
                rulesColor={colors.semantic.border}
                rulesThickness={1}
                pointerConfig={{
                  activatePointersOnLongPress: true,
                  activatePointersDelay: 150,
                  pointerColor: iconColor,
                  radius: 4,
                  pointerStripColor: colors.neutral[300],
                  pointerStripWidth: 1,
                  hidePointerForMissingValues: true,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelWidth: 120 * fontScale,
                  pointerLabelHeight: 64 * fontScale,
                  pointerLabelComponent: (
                    _items: lineDataItem[],
                    _secondary: unknown,
                    index: number,
                  ) => {
                    const point = points[index];
                    if (!point || point.value === null) return null;
                    return (
                      <View className="rounded-lg border border-border bg-card px-3 py-2">
                        <Text className="text-sm font-bold text-foreground">
                          {formatValue(point.value)}
                        </Text>
                        <Text className="text-xs font-sans text-foreground">
                          {point.label}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            )}
          </View>
          <Text className="text-xs font-sans text-foreground">
            Hold the chart to inspect readings.
          </Text>
        </>
      )}
    </View>
  );
}
