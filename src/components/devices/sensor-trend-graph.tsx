import { View, Text } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface SensorTrendGraphProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  yLabels: string[];
  xLabels: string[];
  mockPath: string;
}

export function SensorTrendGraph({ title, icon: Icon, iconColor, yLabels, xLabels, mockPath }: SensorTrendGraphProps) {
  return (
    <View className="bg-card rounded-2xl border border-border p-5 gap-4">
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <Icon size={24} color={iconColor} strokeWidth={1.5} />
        <View className="justify-center pt-0.5">
          <Text className="text-sm font-bold text-foreground">{title}</Text>
        </View>
      </View>

      {/* Graph Area */}
      <View className="flex-row gap-3">
        {/* Y Axis */}
        <View className="justify-between items-center py-1 h-[100px]">
          {yLabels.map((label, index) => (
            <Text key={index} className="text-[10px] text-foreground font-sans">
              {label}
            </Text>
          ))}
        </View>

        {/* Chart Box */}
        <View className="flex-1 h-[100px] justify-between relative">
          {/* Grid lines */}
          <View className="absolute top-0 w-full h-[1px] bg-border opacity-50" />
          <View className="absolute top-[50px] w-full h-[1px] bg-border opacity-50" />
          <View className="absolute bottom-0 w-full h-[1px] bg-border opacity-50" />
          
          {/* SVG Line */}
          <View className="absolute inset-0">
            <Svg width="100%" height="100%" viewBox="0 0 348 100" preserveAspectRatio="none">
              <Path
                d={mockPath}
                stroke={iconColor}
                strokeWidth="2"
                fill="none"
              />
            </Svg>
          </View>
        </View>
      </View>

      {/* X Axis */}
      <View className="flex-row justify-between pl-8">
        {xLabels.map((label, index) => (
          <Text key={index} className="text-[10px] text-foreground font-sans">
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
