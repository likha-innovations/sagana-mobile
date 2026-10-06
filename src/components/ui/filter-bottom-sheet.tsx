import React, { useCallback, useMemo, forwardRef } from 'react';
import { Text, Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Button } from './button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterBottomSheetProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  options?: string[];
}

export const FilterBottomSheet = forwardRef<BottomSheetModal, FilterBottomSheetProps>(({ 
  selectedFilter, 
  onSelectFilter,
  options = ['Per day', 'Per week', 'Per month']
}, ref) => {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['55%'], []);

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
        <View style={{ marginBottom: 24, marginHorizontal: -24 }}>
          {options.map((option) => {
            const isSelected = selectedFilter === option;
            return (
              <Pressable
                key={option}
                onPress={() => onSelectFilter(option)}
                className={`py-4 px-6 ${isSelected ? 'bg-[#E5ECC4]' : ''}`}
              >
                <Text 
                  className={`text-base text-foreground ${isSelected ? 'font-bold' : 'font-medium'}`}
                  style={{ fontFamily: isSelected ? 'SpotifyMix-Bold' : 'SpotifyMix-Medium' }}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}

          <Pressable 
            className={`py-4 px-6 flex-row items-center justify-between ${selectedFilter === 'Custom range' ? 'bg-[#E5ECC4]' : ''}`}
            onPress={() => onSelectFilter('Custom range')}
          >
            <Text 
              className={`text-base text-foreground ${selectedFilter === 'Custom range' ? 'font-bold' : 'font-medium'}`}
              style={{ fontFamily: selectedFilter === 'Custom range' ? 'SpotifyMix-Bold' : 'SpotifyMix-Medium' }}
            >
              Filter by date range
            </Text>
            <ChevronRight size={20} color="#414141" strokeWidth={1.5} />
          </Pressable>
        </View>

        <Button 
          onPress={() => { (ref as any)?.current?.dismiss() }} 
          className="w-full mt-auto"
          size="lg"
        >
          <Text 
            className="text-white text-base font-bold"
            style={{ fontFamily: 'SpotifyMix-Bold' }}
          >
            Apply filter
          </Text>
        </Button>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
