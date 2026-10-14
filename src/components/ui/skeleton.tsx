import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ViewProps) {
  return (
    <View
      {...props}
      className={cn("rounded-md bg-skeleton", className)}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
