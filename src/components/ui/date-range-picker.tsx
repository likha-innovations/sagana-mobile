import React, { useCallback, useMemo, forwardRef, useState } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './button';
import { format } from 'date-fns';

interface DateRangePickerProps {
  onApply: (range: { startDate: string; endDate: string }) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  minDate?: string;
  maxDate?: string;
}

export const DateRangePicker = forwardRef<BottomSheetModal, DateRangePickerProps>(({
  onApply,
  initialStartDate,
  initialEndDate,
  minDate,
  maxDate
}, ref) => {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['70%'], []);
  
  const [startDate, setStartDate] = useState<string | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<string | null>(initialEndDate || null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const onDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else {
      const d1 = new Date(startDate);
      const d2 = new Date(day.dateString);
      if (d2 < d1) {
        // Swap if end date is before start date
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (startDate) {
      marks[startDate] = { startingDay: true, color: '#718619', textColor: 'white' };
    }
    if (endDate) {
      marks[endDate] = { endingDay: true, color: '#718619', textColor: 'white' };
      
      // fill days between
      const d1 = new Date(startDate!);
      const d2 = new Date(endDate);
      const current = new Date(d1);
      current.setDate(current.getDate() + 1);
      while (current < d2) {
        marks[format(current, 'yyyy-MM-dd')] = { color: '#E5ECC4', textColor: '#414141' };
        current.setDate(current.getDate() + 1);
      }
    } else if (startDate) {
      marks[startDate] = { startingDay: true, endingDay: true, color: '#718619', textColor: 'white' };
    }
    return marks;
  }, [startDate, endDate]);

  const handleApply = () => {
    if (startDate && endDate) {
      onApply({ startDate, endDate });
      (ref as any)?.current?.dismiss();
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#FAF9EE', borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: '#E5E5E1', width: 48 }}
      enablePanDownToClose
    >
      <BottomSheetView 
        style={{ paddingBottom: Math.max(insets.bottom + 24, 32), flex: 1, paddingHorizontal: 24, paddingTop: 12 }}
      >
        <Text 
          className="text-lg font-bold text-foreground mb-4"
          style={{ fontFamily: 'SpotifyMix-Bold' }}
        >
          Select Date Range
        </Text>

        <View className="flex-1">
          <Calendar
            markingType="period"
            markedDates={markedDates}
            onDayPress={onDayPress}
            minDate={minDate ? format(new Date(minDate), 'yyyy-MM-dd') : undefined}
            maxDate={maxDate ? format(new Date(maxDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
            theme={{
              calendarBackground: '#FAF9EE',
              textSectionTitleColor: '#AFAEA7',
              selectedDayBackgroundColor: '#718619',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#718619',
              dayTextColor: '#414141',
              textDisabledColor: '#E2E1DC',
              dotColor: '#718619',
              selectedDotColor: '#ffffff',
              arrowColor: '#414141',
              disabledArrowColor: '#E2E1DC',
              monthTextColor: '#414141',
              indicatorColor: '#718619',
              textDayFontFamily: 'SpotifyMix-Medium',
              textMonthFontFamily: 'SpotifyMix-Bold',
              textDayHeaderFontFamily: 'SpotifyMix-Medium',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13
            }}
          />
        </View>

        <Button 
          onPress={handleApply} 
          className="w-full mt-4"
          size="lg"
          disabled={!startDate || !endDate}
        >
          <Text 
            className={`text-base font-bold ${(!startDate || !endDate) ? 'text-muted-foreground' : 'text-white'}`}
            style={{ fontFamily: 'SpotifyMix-Bold' }}
          >
            Apply range
          </Text>
        </Button>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
