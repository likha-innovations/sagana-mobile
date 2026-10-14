import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricSkeletons({ stacked }: { stacked: boolean }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading dashboard metrics"
      accessibilityState={{ busy: true }}
      className={stacked ? "gap-3" : "flex-row items-stretch gap-3"}
    >
      <View className="gap-3" style={stacked ? undefined : { flex: 212 }}>
        {[0, 1].map((index) => (
          <Skeleton
            key={index}
            className="min-h-[114px] grow rounded-[14px]"
          />
        ))}
      </View>
      <View className="gap-3" style={stacked ? undefined : { flex: 156 }}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="min-h-[72px] rounded-[14px]" />
        ))}
      </View>
    </View>
  );
}

export function CompletedBatchSkeletons() {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading completed batches"
      accessibilityState={{ busy: true }}
      className="gap-3"
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className="min-h-[76px] flex-row items-center gap-6 rounded-[14px] border border-border bg-card px-6 py-4"
        >
          <Skeleton className="h-6 w-6" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-full" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MachineSkeletons({ stacked }: { stacked: boolean }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading machines"
      accessibilityState={{ busy: true }}
      className="gap-3"
    >
      {[0, 1].map((index) => (
        <View
          key={index}
          className="gap-4 rounded-[14px] border border-border bg-card px-4 py-6"
        >
          <Skeleton className="h-5 w-2/5" />
          <View className="flex-row flex-wrap gap-2">
            {[0, 1, 2, 3].map((sensor) => (
              <Skeleton
                key={sensor}
                className="h-[99px] rounded-[8px]"
                style={{ flexBasis: stacked ? "47%" : 0, flexGrow: 1 }}
              />
            ))}
          </View>
          <View className="flex-row justify-between gap-3 pt-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/4" />
          </View>
        </View>
      ))}
    </View>
  );
}
