import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface DateFilterToggleProps {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export function DateFilterToggle({ label, onPrev, onNext }: DateFilterToggleProps) {
  return (
    <View className="flex-row items-center justify-between bg-card px-4 py-3 rounded-full border border-border shadow-md min-w-[200px]">
      <Pressable onPress={onPrev} className="p-1">
        <ChevronLeft size={20} color="#414141" strokeWidth={1.5} />
      </Pressable>
      
      <Text className="text-sm font-medium text-foreground">
        {label}
      </Text>
      
      <Pressable onPress={onNext} className="p-1">
        <ChevronRight size={20} color="#414141" strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}
