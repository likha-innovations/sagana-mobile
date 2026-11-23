import * as SecureStore from 'expo-secure-store';

const floorMemory = new Map<string, 'lowered' | 'raised'>();

export function getCachedFloorPosition(machineId: string): 'lowered' | 'raised' {
  return floorMemory.get(machineId) ?? 'lowered';
}

export async function getFloorPosition(machineId: string): Promise<'lowered' | 'raised'> {
  if (floorMemory.has(machineId)) {
    return floorMemory.get(machineId)!;
  }
  try {
    const val = await SecureStore.getItemAsync(`sagana_floor_${machineId}`);
    if (val === 'raised' || val === 'lowered') {
      floorMemory.set(machineId, val);
      return val;
    }
  } catch {
    // fallback
  }
  return 'lowered';
}

export async function setFloorPosition(
  machineId: string,
  position: 'lowered' | 'raised',
): Promise<void> {
  floorMemory.set(machineId, position);
  try {
    await SecureStore.setItemAsync(`sagana_floor_${machineId}`, position);
  } catch {
    // fallback
  }
}
