import { View, Text, Pressable } from "react-native";
import { Box, Calendar, Weight } from "lucide-react-native";
import { differenceInCalendarDays, format } from "date-fns";
import { CompostIcon } from "@/components/icons";
import { colors } from "@/constants";
import type { CompletedBatch } from "@/types/batch";

export function CompletedBatchCard({
  batch,
  onPress,
}: {
  batch: CompletedBatch;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;
  const days = differenceInCalendarDays(
    new Date(batch.completionDate),
    new Date(batch.startDate),
  );
  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={
        onPress ? `View batch ${batch.batchCode}` : undefined
      }
      className="flex-row items-center gap-6 rounded-[14px] border border-border bg-card px-6 py-4"
    >
      <CompostIcon size={24} color={colors.brand[500]} />
      <View className="flex-1 gap-2">
        <Text className="text-[14px] font-bold text-foreground">
          {format(new Date(batch.completionDate), "MMMM d, yyyy")}
        </Text>
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          {[
            { Icon: Calendar, text: `${days} ${days === 1 ? "Day" : "Days"}` },
            { Icon: Weight, text: batch.finalWeight == null ? "Weight unavailable" : `${batch.finalWeight} kg` },
            { Icon: Box, text: batch.machineName },
          ].map(({ Icon, text }) => (
            <View key={text} className="flex-row items-center gap-1.5">
              <Icon size={12} color={colors.semantic.foreground} />
              <Text className="text-[12px] font-sans text-foreground">
                {text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Container>
  );
}
