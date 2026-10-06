import { View, Text } from 'react-native';
import { Thermometer, Droplets, Wind, Cloud } from 'lucide-react-native';
import { getPhaseStep, type DashboardMachine } from '@/lib/mock-data';

export interface MachineCardProps {
  machine: DashboardMachine;
}

export function MachineCard({ machine }: MachineCardProps) {
  const step = getPhaseStep(machine.phase);

  return (
    <View className="rounded-[14px] border border-border bg-card p-4 gap-6">
      {/* Header Info */}
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-[14px] font-bold text-foreground">{machine.name}</Text>
          <Text className="text-[12px] text-muted-foreground font-sans">Day {machine.day}</Text>
        </View>
        <Text className="text-[12px] text-muted-foreground font-sans">{machine.phase}</Text>
      </View>

      {/* Progress Bar */}
      <View className="flex-row h-[6px] gap-2.5">
        <View className={`flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-progress'}`} />
        <View className={`flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-progress'}`} />
        <View className={`flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-progress'}`} />
      </View>

      {/* Sensor Grid (Row) */}
      <View className="flex-row justify-between gap-2">
        <View className="flex-1 h-[99px] border border-border rounded-[8px] items-center justify-center gap-2.5 bg-card">
          <Thermometer size={24} color={machine.sensors.temperature.color} />
          <View className="items-center">
            <Text style={{ color: machine.sensors.temperature.color }} className="text-[14px] font-bold">
              {machine.sensors.temperature.value}{machine.sensors.temperature.unit}
            </Text>
            <Text className="text-[12px] text-muted-foreground font-sans">Temp.</Text>
          </View>
        </View>

        <View className="flex-1 h-[99px] border border-border rounded-[8px] items-center justify-center gap-2.5 bg-card">
          <Droplets size={24} color={machine.sensors.moisture.color} />
          <View className="items-center">
            <Text style={{ color: machine.sensors.moisture.color }} className="text-[14px] font-bold">
              {machine.sensors.moisture.value}{machine.sensors.moisture.unit}
            </Text>
            <Text className="text-[12px] text-muted-foreground font-sans">Moisture</Text>
          </View>
        </View>

        <View className="flex-1 h-[99px] border border-border rounded-[8px] items-center justify-center gap-2.5 bg-card">
          <Wind size={24} color={machine.sensors.oxygen.color} />
          <View className="items-center">
            <Text style={{ color: machine.sensors.oxygen.color }} className="text-[14px] font-bold">
              {machine.sensors.oxygen.value}{machine.sensors.oxygen.unit}
            </Text>
            <Text className="text-[12px] text-muted-foreground font-sans">O2</Text>
          </View>
        </View>

        <View className="flex-1 h-[99px] border border-border rounded-[8px] items-center justify-center gap-2.5 bg-card">
          <Cloud size={24} color={machine.sensors.carbonDioxide.color} />
          <View className="items-center">
            <Text style={{ color: machine.sensors.carbonDioxide.color }} className="text-[14px] font-bold">
              {machine.sensors.carbonDioxide.value}{machine.sensors.carbonDioxide.unit}
            </Text>
            <Text className="text-[12px] text-muted-foreground font-sans">CO2</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
