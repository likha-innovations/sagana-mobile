import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

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
