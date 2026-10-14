import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { ChevronRight } from "lucide-react-native";
import { useDynamicLayout } from "@/hooks/use-layout";
import { colors } from "@/constants";
import { Button } from "./button";

interface FilterBottomSheetProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  options?: string[];
  onApply?: (filter: string) => void;
  onDismiss?: () => void;
}
export const FilterBottomSheet = forwardRef<
  BottomSheetModal,
  FilterBottomSheetProps
>(
  (
    {
      selectedFilter,
      onSelectFilter,
      options = ["Per day", "Per week", "Per month"],
      onApply,
      onDismiss,
    },
    ref,
  ) => {
    const modal = useRef<BottomSheetModal>(null);
    const { stackScrollPadding, headerPaddingTop } = useDynamicLayout();
    const { height } = useWindowDimensions();
    const [draft, setDraft] = useState(selectedFilter);
    const [open, setOpen] = useState(false);
    useEffect(() => {
      if (!open) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          modal.current?.dismiss();
          return true;
        },
      );
      return () => subscription.remove();
    }, [open]);
    const backdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.4}
        />
      ),
      [],
    );
    const selection = onApply ? draft : selectedFilter;
    return (
      <BottomSheetModal
        ref={(value) => {
          modal.current = value;
          if (typeof ref === "function") ref(value);
          else if (ref) ref.current = value;
        }}
        enableDynamicSizing
        maxDynamicContentSize={height - headerPaddingTop}
        onChange={(index) => {
          setOpen(index >= 0);
          if (index >= 0) setDraft(selectedFilter);
        }}
        onDismiss={() => {
          setOpen(false);
          onDismiss?.();
        }}
        backdropComponent={backdrop}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: colors.semantic.background,
          borderRadius: 32,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.gray.border,
          width: 40,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: stackScrollPadding,
          }}
        >
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: selection === option }}
              onPress={() =>
                onApply ? setDraft(option) : onSelectFilter(option)
              }
              className={
                selection === option
                  ? "min-h-12 justify-center bg-brand-100 px-8 py-3"
                  : "min-h-12 justify-center px-8 py-3"
              }
            >
              <Text
                className={
                  selection === option
                    ? "text-[14px] font-bold text-foreground"
                    : "text-[14px] font-sans text-foreground"
                }
              >
                {option}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelectFilter("Custom range")}
            className="min-h-12 flex-row items-center justify-between px-8 py-3"
          >
            <Text className="text-[14px] font-sans text-foreground">
              Filter by date range
            </Text>
            <ChevronRight size={20} color={colors.semantic.foreground} />
          </Pressable>
          <View className="mt-4 px-4">
            <Button
              onPress={() => {
                onApply?.(draft);
                modal.current?.dismiss();
              }}
              size="lg"
            >
              <Text className="text-[14px] font-bold text-primary-foreground">
                Apply filter
              </Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
FilterBottomSheet.displayName = "FilterBottomSheet";
