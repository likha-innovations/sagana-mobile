import { View, Text, Pressable } from 'react-native';
import { ChevronRight, Radio, Thermometer, Droplets, Wind, Cloud, Clock, Mountain } from 'lucide-react-native';
import type { Machine } from '@/types/machine';
import { formatTimeAgo } from '@/lib/utils';

interface MachineCardProps {
  machine: Machine;
  onPress: () => void;
}

export function MachineCard({ machine, onPress }: MachineCardProps) {
  const isOffline = machine.status === 'offline';
  const isVacant = machine.status === 'maintenance' || machine.status === 'available' || !machine.latest_readings;

  // Values
  const temp = isVacant ? '--' : `${machine.latest_readings?.temperature}°C`;
  const moisture = isVacant ? '--' : `${machine.latest_readings?.moisture}%`;
  const o2 = isVacant ? '--' : `${machine.latest_readings?.oxygen}%`;
  const co2 = isVacant ? '--' : `${machine.latest_readings?.co2}%`;

  // Colors
  const tempColor = isVacant ? '#AFAEA7' : '#AB6DD5';
  const moistureColor = isVacant ? '#AFAEA7' : '#51A7B1';
  const o2Color = isVacant ? '#AFAEA7' : '#DBCC41';
  const co2Color = isVacant ? '#AFAEA7' : '#6CAD6C';

  // Footer
  const phaseText = isVacant ? 'Vacant' : 'Thermophilic Phase';
  const phaseColorClass = isVacant ? 'text-muted-foreground' : 'text-primary';
  const phaseIconColor = isVacant ? '#AFAEA7' : '#718619';
  const timeAgo = isVacant ? '--' : formatTimeAgo(machine.latest_readings?.updated_at);

  return (
    <Pressable
      onPress={onPress}
      className="bg-card rounded-[20px] border border-border p-4 mb-4"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <Radio size={20} color={isOffline ? '#AFAEA7' : '#718619'} />
          <Text className="text-[15px] font-bold text-foreground">
            {machine.name}
          </Text>
        </View>
        <ChevronRight size={20} color="#414141" strokeWidth={2} />
      </View>

      {/* Sensor Grid */}
      <View className="flex-row justify-between mb-4 gap-2">
        {/* Temp */}
        <View className="items-center justify-center flex-1 border border-border rounded-xl py-3">
          <Thermometer size={18} color={tempColor} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: tempColor }}>{temp}</Text>
          <Text className="text-[11px] font-medium text-foreground mt-0.5">Temp.</Text>
        </View>
        
        {/* Moisture */}
        <View className="items-center justify-center flex-1 border border-border rounded-xl py-3">
          <Droplets size={18} color={moistureColor} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: moistureColor }}>{moisture}</Text>
          <Text className="text-[11px] font-medium text-foreground mt-0.5">Moisture</Text>
        </View>

        {/* O2 */}
        <View className="items-center justify-center flex-1 border border-border rounded-xl py-3">
          <Wind size={18} color={o2Color} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: o2Color }}>{o2}</Text>
          <Text className="text-[11px] font-medium text-foreground mt-0.5">O2</Text>
        </View>

        {/* CO2 */}
        <View className="items-center justify-center flex-1 border border-border rounded-xl py-3">
          <Cloud size={18} color={co2Color} className="mb-2" />
          <Text className="text-sm font-bold" style={{ color: co2Color }}>{co2}</Text>
          <Text className="text-[11px] font-medium text-foreground mt-0.5">CO2</Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex-row items-center gap-2">
          <Mountain size={16} color={phaseIconColor} />
          <Text className={`text-[13px] font-bold ${phaseColorClass}`}>{phaseText}</Text>
        </View>
        
        <View className="flex-row items-center gap-1.5">
          <Clock size={14} color="#AFAEA7" />
          <Text className="text-[13px] font-medium text-muted-foreground">{timeAgo}</Text>
        </View>
      </View>
    </Pressable>
  );
}
