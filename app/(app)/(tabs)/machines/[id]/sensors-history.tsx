import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, Thermometer, Droplets, Wind, Cloud } from 'lucide-react-native';
import { format, addDays, subDays } from 'date-fns';
import { useDynamicLayout } from '@/hooks';
import { DateFilterToggle } from '@/components/ui/date-filter-toggle';
import { FilterBottomSheet } from '@/components/ui/filter-bottom-sheet';
import { useSensorHistory } from '@/hooks/use-machines';
import { SensorTrendGraph } from '@/components/devices/sensor-trend-graph';

export default function SensorsHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { insets, scrollPaddingBottom, floatingBottom } = useDynamicLayout();

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const [selectedFilter, setSelectedFilter] = useState('Per day');
  const [selectedDate, setSelectedDate] = useState(new Date('2026-09-30T12:00:00Z'));

  const handlePrevDate = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDate = () => setSelectedDate(prev => addDays(prev, 1));
  const dateLabel = format(selectedDate, 'MMMM d, yyyy');

  const { data: history } = useSensorHistory(id, format(selectedDate, 'yyyy-MM-dd'));

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full">
            <ChevronLeft size={24} color="#414141" />
          </Pressable>
          <Text className="text-base font-bold text-foreground ml-2">
            Sensors History
          </Text>
        </View>
        <Pressable className="flex-row items-center gap-1" onPress={() => filterSheetRef.current?.present()}>
          <Text className="text-sm font-medium text-foreground">{selectedFilter}</Text>
          <ChevronDown size={16} color="#414141" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: scrollPaddingBottom, gap: 16 }}>

        {history && (
          <>
            <SensorTrendGraph
              title="Temperature"
              icon={Thermometer}
              iconColor="#AB6DD5"
              yLabels={['60°C', '40°C', '20°C']}
              xLabels={['00:00', '06:00', '12:00', '18:00', '24:00']}
              data={history.temperature}
              maxVal={60}
            />

            <SensorTrendGraph
              title="Moisture"
              icon={Droplets}
              iconColor="#51A7B1"
              yLabels={['40%', '20%', '0%']}
              xLabels={['00:00', '06:00', '12:00', '18:00', '24:00']}
              data={history.moisture}
              maxVal={60}
            />

            <SensorTrendGraph
              title="Oxygen"
              icon={Wind}
              iconColor="#DBCC41"
              yLabels={['100%', '50%', '0%']}
              xLabels={['00:00', '06:00', '12:00', '18:00', '24:00']}
              data={history.oxygen}
              maxVal={100}
            />

            <SensorTrendGraph
              title="Carbon Dioxide"
              icon={Cloud}
              iconColor="#6CAD6C"
              yLabels={['0.1%', '0.05%', '0%']}
              xLabels={['00:00', '06:00', '12:00', '18:00', '24:00']}
              data={history.co2}
              maxVal={50}
            />
          </>
        )}
      </ScrollView>

      {/* Floating Date Filter */}
      <View 
        className="absolute left-0 right-0 items-center" 
        style={{ bottom: floatingBottom, zIndex: 50, elevation: 10 }}
        pointerEvents="box-none"
      >
        <DateFilterToggle 
          label={dateLabel} 
          onPrev={handlePrevDate}
          onNext={handleNextDate}
        />
      </View>

      {/* Bottom Sheet Filter */}
      <FilterBottomSheet 
        ref={filterSheetRef}
        selectedFilter={selectedFilter}
        onSelectFilter={(val) => {
          setSelectedFilter(val);
          filterSheetRef.current?.dismiss();
        }}
      />
    </View>
  );
}
