import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
// Lazy-load: native module only exists on iOS dev client builds
const DateTimePicker =
  Platform.OS === 'ios'
    ? require('@react-native-community/datetimepicker').default
    : null;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import { format } from 'date-fns';

export interface BirthdayBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

export interface BirthdayBottomSheetProps {
  value: string;
  onConfirm: (formattedDate: string, rawDate: Date) => void;
  onDismiss?: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

const ITEM_HEIGHT = 44;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseBirthday(value?: string): Date {
  if (!value) return new Date(2000, 0, 1);
  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    const month = parseInt(digits.slice(0, 2), 10) - 1;
    const day = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date(2000, 0, 1);
}

// Lightweight, lag-free wheel column using native ScrollView snapping
function WheelColumn({
  items,
  initialIndex,
  onSelect,
  flex = 1,
}: {
  items: string[];
  initialIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
}) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={{ height: ITEM_HEIGHT * 5, flex }} className="overflow-hidden">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        contentOffset={{ y: Math.max(0, initialIndex * ITEM_HEIGHT), x: 0 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const clamped = Math.max(0, Math.min(items.length - 1, index));
          onSelect(clamped);
        }}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
      >
        {items.map((item, idx) => (
          <View
            key={`${item}-${idx}`}
            style={{ height: ITEM_HEIGHT }}
            className="items-center justify-center px-1"
          >
            <Text className="text-[16px] font-medium text-foreground text-center">
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const BirthdayBottomSheet = forwardRef<
  BirthdayBottomSheetRef,
  BirthdayBottomSheetProps
>(function BirthdayBottomSheet(
  { value, onConfirm, onDismiss, maximumDate, minimumDate },
  ref
) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [date, setDate] = useState<Date>(() => parseBirthday(value));

  // Snap points: 45% for default view, 75% for expanded view
  const snapPoints = useMemo(() => ['45%', '75%'], []);

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();

  const maxYear = (maximumDate ?? new Date()).getFullYear();
  const minYear = (minimumDate ?? new Date(1920, 0, 1)).getFullYear();

  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) =>
        String(maxYear - i)
      ),
    [maxYear, minYear]
  );

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentYear, currentMonth]
  );

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
    [daysInMonth]
  );

  const yearIndex = useMemo(
    () => years.indexOf(String(currentYear)),
    [years, currentYear]
  );

  const handleConfirm = useCallback(() => {
    const formatted = format(date, 'MM / dd / yyyy');
    onConfirm(formatted, date);
    bottomSheetRef.current?.dismiss();
  }, [date, onConfirm]);

  const handleCancel = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onDismiss?.();
  }, [onDismiss]);

  const present = useCallback(() => {
    setDate(parseBirthday(value));
    bottomSheetRef.current?.present();
  }, [value]);

  const dismiss = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  useImperativeHandle(ref, () => ({ present, dismiss }), [present, dismiss]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableContentPanningGesture={false}
      handleIndicatorStyle={{
        backgroundColor: '#C8C7BE',
        width: 40,
        height: 4,
      }}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: '#FAF9EE',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <BottomSheetView
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        className="flex-1 px-4 pt-2"
      >
        {/* Header Action Bar */}
        <View className="w-full flex-row items-center justify-between px-3 pb-3">
          <Pressable
            onPress={handleCancel}
            hitSlop={12}
            className="p-2 -ml-2 rounded-full active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <X size={24} color="#414141" strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            hitSlop={12}
            className="p-2 -mr-2 rounded-full active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Confirm"
          >
            <Check size={24} color="#718619" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Date Picker Body */}
        <View className="w-full items-center justify-center flex-1">
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
              maximumDate={maximumDate ?? new Date()}
              minimumDate={minimumDate ?? new Date(1920, 0, 1)}
              textColor="#414141"
              themeVariant="light"
              style={{ width: '100%', height: 216 }}
            />
          ) : (
            <View
              style={{ height: ITEM_HEIGHT * 5 }}
              className="w-full relative px-2 flex-row items-center justify-between"
            >
              {/* Center Highlight Bar matching reference design */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: ITEM_HEIGHT * 2,
                  height: ITEM_HEIGHT,
                  left: 12,
                  right: 12,
                  backgroundColor: '#EAE8DD',
                  borderRadius: 12,
                }}
              />

              {/* Month */}
              <WheelColumn
                items={MONTHS}
                initialIndex={currentMonth}
                flex={1.4}
                onSelect={(mIdx) => {
                  const maxDays = new Date(currentYear, mIdx + 1, 0).getDate();
                  const safeDay = Math.min(currentDay, maxDays);
                  setDate(new Date(currentYear, mIdx, safeDay));
                }}
              />

              {/* Day */}
              <WheelColumn
                items={days}
                initialIndex={Math.max(0, currentDay - 1)}
                flex={1}
                onSelect={(dIdx) => {
                  setDate(new Date(currentYear, currentMonth, dIdx + 1));
                }}
              />

              {/* Year */}
              <WheelColumn
                items={years}
                initialIndex={Math.max(0, yearIndex)}
                flex={1.2}
                onSelect={(yIdx) => {
                  const selectedY = parseInt(years[yIdx], 10);
                  const maxDays = new Date(
                    selectedY,
                    currentMonth + 1,
                    0
                  ).getDate();
                  const safeDay = Math.min(currentDay, maxDays);
                  setDate(new Date(selectedY, currentMonth, safeDay));
                }}
              />
            </View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
