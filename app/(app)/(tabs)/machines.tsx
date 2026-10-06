import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from 'lucide-react-native';
import { colors } from '@/constants';

export default function MachinesScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center p-6 gap-4">
        <Box size={48} color={colors.gray.textIcon} />
        <Text className="text-xl font-semibold text-foreground">
          Machines Placeholder
        </Text>
        <Text className="text-center text-sm text-muted-foreground font-sans">
          This tab will contain the list of SAGANA machines and their individual detailed statuses.
        </Text>
      </View>
    </View>
  );
}
