import { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, Fan, ShowerHead, AlertTriangle, Wind } from 'lucide-react-native';
import { useDynamicLayout } from '@/hooks';
import { FilterBottomSheet } from '@/components/ui/filter-bottom-sheet';
import { DateRangePicker } from '@/components/ui';
import { AutomationLogCard } from '@/components/devices/automation-log-card';
import { format } from 'date-fns';

import { useAutomationLogs, useMachine } from '@/hooks/use-machines';
import type { AutomationLog } from '@/types/machine';

export default function AutomationLogsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { insets, scrollPaddingBottom } = useDynamicLayout();

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const dateRangePickerRef = useRef<BottomSheetModal>(null);
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>();

  const { data: machine } = useMachine(id);
  const { data: logs, isLoading, isFetching } = useAutomationLogs(id, selectedFilter, dateRange);
  
  const isQuerying = isLoading || isFetching;

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

  // Group logs by date string
  const groupedLogs = (logs || []).reduce((acc, log) => {
    const d = new Date(log.created_at);
    const now = new Date(); // Use real now
    let groupKey = format(d, 'MMM d, yyyy');
    if (d.toDateString() === now.toDateString()) {
      groupKey = 'Today';
    } else if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) {
      groupKey = 'Yesterday';
    }
    
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(log);
    return acc;
  }, {} as Record<string, AutomationLog[]>);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full">
            <ChevronLeft size={24} color="#414141" />
          </Pressable>
          <Text className="text-base font-bold text-foreground ml-2" style={{ fontFamily: 'SpotifyMix-Bold' }}>
            Automation Logs
          </Text>
        </View>
        <Pressable className="flex-row items-center gap-1" onPress={() => filterSheetRef.current?.present()}>
          <Text className="text-sm font-medium text-foreground">{selectedFilter}</Text>
          <ChevronDown size={16} color="#414141" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: scrollPaddingBottom }}>
        {isQuerying ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#718619" />
          </View>
        ) : (
          <>
            {Object.entries(groupedLogs).map(([groupDate, groupLogs]) => (
              <View key={groupDate} className="mb-6">
                <Text className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'SpotifyMix-Bold' }}>
                  {groupDate}
                </Text>

                {groupLogs.map((log) => {
                  const { icon, color } = getIconConfig(log.type);
                  
                  const date = new Date(log.created_at);
                  const now = new Date();
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
              </View>
            ))}

            {Object.keys(groupedLogs).length === 0 && (
              <View className="items-center justify-center py-20">
                <Text className="text-base text-muted-foreground font-medium text-center">
                  No automation logs found for the selected filter.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Sheet Filter */}
      <FilterBottomSheet 
        ref={filterSheetRef}
        selectedFilter={selectedFilter}
        onSelectFilter={(val) => {
          if (val === 'Custom range') {
            filterSheetRef.current?.dismiss();
            dateRangePickerRef.current?.present();
          } else {
            setSelectedFilter(val);
            filterSheetRef.current?.dismiss();
          }
        }}
        options={['All dates', 'Today', 'Last 7 days', 'Last 31 days']}
      />

      <DateRangePicker 
        ref={dateRangePickerRef}
        minDate={machine?.created_at}
        maxDate={new Date().toISOString()}
        onApply={(range) => {
          setDateRange({ start: range.startDate, end: range.endDate });
          setSelectedFilter('Custom range');
        }}
      />
    </View>
  );
}
