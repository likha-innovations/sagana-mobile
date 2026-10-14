import { useState } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";
import { Thermometer, Droplets, Wind, Cloud } from "lucide-react-native";
import { useHistory } from "@/hooks/use-history";
import { useDynamicLayout } from "@/hooks/use-layout";
import { aggregateReadings, dateBounds, sensorRange } from "@/lib/history";
import type { DateRange, SensorPeriod, HistoryScope } from "@/types/history";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryDateFilter } from "@/components/history/history-date-filter";
import { HistoryState } from "@/components/history/history-state";
import { SensorTrendGraph } from "@/components/devices/sensor-trend-graph";
import { DateFilterToggle } from "@/components/ui/date-filter-toggle";
import { colors } from "@/constants";

export function SensorHistoryScreen({ scope }: { scope: HistoryScope }) {
  const { width, fontScale } = useWindowDimensions();
  const query = useHistory(scope);
  const { readings } = query;
  const { tabBarHeight } = useDynamicLayout();
  const [period, setPeriod] = useState<SensorPeriod>("Per day");
  const [custom, setCustom] = useState<DateRange>();
  const [anchor, setAnchor] = useState<Date>();
  const [toggleHeight, setToggleHeight] = useState(56);
  const date =
    anchor ??
    parseISO(
      readings.at(-1)?.recorded_at ?? query.endDate ?? new Date().toISOString(),
    );
  const range = sensorRange(period, date, custom);
  const bounds = dateBounds(range);
  const series = aggregateReadings(readings, range, period === "Per day");
  const hasData = Object.values(series).some((points) =>
    points.some((point) => point.value !== null),
  );
  const shift = (amount: number) =>
    period === "Per month"
      ? addMonths(date, amount)
      : period === "Per week"
        ? addWeeks(date, amount)
        : addDays(date, amount);
  const previousRange = dateBounds(sensorRange(period, shift(-1)));
  const nextRange = dateBounds(sensorRange(period, shift(1)));
  const minDate = query.startDate
    ? dateBounds({ startDate: query.startDate, endDate: query.startDate }).start
    : date;
  const maxDate = dateBounds({
    startDate: query.endDate,
    endDate: query.endDate,
  }).end;
  const label =
    period === "Per day"
      ? format(date, "MMMM d, yyyy")
      : `${format(bounds.start, "MMM d")} – ${format(bounds.end, "MMM d, yyyy")}`;
  const xLabels =
    period === "Per day"
      ? ["00:00", "06:00", "12:00", "18:00", "24:00"]
      : [
          format(bounds.start, "MMM d"),
          format(addDays(bounds.end, 1), "MMM d"),
        ];
  const sensors = [
    {
      key: "temperature" as const,
      title: "Temperature Trend",
      icon: Thermometer,
      color: colors.red[500],
      unit: "°C",
      minimumMax: 60,
    },
    {
      key: "moisture" as const,
      title: "Moisture Trend",
      icon: Droplets,
      color: colors.sensors.moisture,
      unit: "%",
      minimumMax: 100,
    },
    {
      key: "oxygen" as const,
      title: "Oxygen Trend",
      icon: Wind,
      color: colors.sensors.oxygen,
      unit: "%",
      minimumMax: 25,
    },
    {
      key: "co2" as const,
      title: "Carbon Dioxide Trend",
      icon: Cloud,
      color: colors.brand[500],
      unit: "%",
      minimumMax: 0.1,
    },
  ];
  return (
    <View className="flex-1 bg-background">
      <HistoryHeader
        title="Sensors History"
        action={
          query.exists && (
            <HistoryDateFilter
              selected={period}
              range={custom}
              minDate={query.startDate}
              maxDate={query.endDate}
              options={["Per day", "Per week", "Per month"]}
              onApply={(next, dates) => {
                if (
                  next === "Per day" ||
                  next === "Per week" ||
                  next === "Per month" ||
                  next === "Custom range"
                )
                  setPeriod(next);
                setCustom(dates);
              }}
            />
          )
        }
      />
      {query.isError ? (
        <HistoryState
          message="Could not load sensor history."
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <HistoryState message="Loading sensor history…" />
      ) : !query.exists ? (
        <HistoryState
          message={
            scope.kind === "batch"
              ? "This completed batch could not be found."
              : "This machine could not be found."
          }
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 12,
              paddingBottom: tabBarHeight + toggleHeight + 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            {!hasData ? (
              <HistoryState message="No sensor readings recorded for this period." />
            ) : (
              sensors.map((sensor) => {
                const points = series[sensor.key];
                const max = Math.max(
                  sensor.minimumMax,
                  ...points.map((point) => point.value ?? 0),
                );
                const tick = (value: number) =>
                  `${Number(value.toFixed(3))}${sensor.unit}`;
                return (
                  <SensorTrendGraph
                    key={sensor.key}
                    title={sensor.title}
                    icon={sensor.icon}
                    iconColor={sensor.color}
                    points={points}
                    maxVal={max}
                    yLabels={[tick(max), tick(max / 2), tick(0)]}
                    xLabels={xLabels}
                  />
                );
              })
            )}
          </ScrollView>
          <View
            pointerEvents="box-none"
            onLayout={(event) =>
              setToggleHeight(event.nativeEvent.layout.height)
            }
            style={{
              position: "absolute",
              bottom: tabBarHeight,
              left: 16,
              right: 16,
              alignItems: "center",
            }}
          >
            <View
              style={{ width: width < 360 || fontScale > 1.2 ? "100%" : 296 }}
            >
              <DateFilterToggle
                prominent
                label={label}
                previousDisabled={
                  period === "Custom range" || previousRange.end < minDate
                }
                nextDisabled={
                  period === "Custom range" || nextRange.start > maxDate
                }
                onPrev={() => setAnchor(shift(-1))}
                onNext={() => setAnchor(shift(1))}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}
