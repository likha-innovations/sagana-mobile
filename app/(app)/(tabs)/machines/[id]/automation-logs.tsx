import { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, Fan, ShowerHead, AlertTriangle, Wind } from 'lucide-react-native';
import { format, addDays, subDays } from 'date-fns';
import { useDynamicLayout } from '@/hooks/use-layout';
import { FilterBottomSheet } from '@/components/ui/filter-bottom-sheet';
import { AutomationLogCard } from '@/components/devices/automation-log-card';

import { useAutomationLogs } from '@/hooks/use-machines';
import type { AutomationLog } from '@/types/device';

export default function AutomationLogsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { insets, scrollPaddingBottom, floatingBottom } = useDynamicLayout();

  const [selectedDate, setSelectedDate] = useState(new Date('2026-09-30T12:00:00Z'));
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const [selectedFilter, setSelectedFilter] = useState('Today');

  const { data: logs } = useAutomationLogs(id);

  // Helper to map log type to icon and color
  const getIconConfig = (type: AutomationLog['type']) => {
    switch (type) {
      case 'blower_on': return { icon: Fan, color: '#718619' };
      case 'sprinkler_on': return { icon: ShowerHead, color: '#51A7B1' };
      case 'emergency_stop': return { icon: AlertTriangle, color: '#E84C4C' };
      case 'ventilation_adjust': return { icon: Wind, color: '#DBCC41' };
      default: return { icon: Fan, color: '#414141' };
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full">
            <ChevronLeft size={24} color="#414141" />
          </Pressable>
          <Text className="text-base font-bold text-foreground ml-2">
            Automation Logs
          </Text>
        </View>
        <Pressable className="flex-row items-center gap-1" onPress={() => filterSheetRef.current?.present()}>
          <Text className="text-sm font-medium text-foreground">{selectedFilter}</Text>
          <ChevronDown size={16} color="#414141" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: scrollPaddingBottom }}>
        <Text className="text-sm font-bold text-foreground mb-4">Today</Text>

        {logs?.map((log) => {
          const { icon, color } = getIconConfig(log.type);
          
          // Simple mock time string formatting
          const date = new Date(log.created_at);
          const now = new Date('2026-10-06T19:21:00Z');
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          let timeAgo = `${diffMins}m ago`;
          if (diffMins > 60) timeAgo = `${Math.floor(diffMins / 60)}h ago`;

          return (
            <AutomationLogCard
              key={log.id}
              icon={icon}
              iconColor={color}
              message={log.message}
              timeAgo={timeAgo}
            />
          );
        })}
      </ScrollView>

      {/* Bottom Sheet Filter */}
      <FilterBottomSheet 
        ref={filterSheetRef}
        selectedFilter={selectedFilter}
        onSelectFilter={(val) => {
          setSelectedFilter(val);
          filterSheetRef.current?.dismiss();
        }}
        options={['All dates', 'Today', 'Last 7 days', 'Last 31 days']}
      />
    </View>
  );
}
