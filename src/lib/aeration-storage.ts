import * as SecureStore from 'expo-secure-store';

export interface AerationConfig {
  mode: 'default' | 'custom';
  onMinutes: number;
  offMinutes: number;
}

const DEFAULT_CONFIG: AerationConfig = {
  mode: 'default',
  onMinutes: 10,
  offMinutes: 5,
};

const aerationMemory = new Map<string, AerationConfig>();

export function getCachedAerationConfig(machineId: string): AerationConfig {
  return aerationMemory.get(machineId) ?? { ...DEFAULT_CONFIG };
}

export async function getAerationConfig(machineId: string): Promise<AerationConfig> {
  if (aerationMemory.has(machineId)) {
    return aerationMemory.get(machineId)!;
  }
  try {
    const raw = await SecureStore.getItemAsync(`sagana_aeration_${machineId}`);
    if (aerationMemory.has(machineId)) {
      return aerationMemory.get(machineId)!;
    }
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AerationConfig>;
      const config: AerationConfig = {
        mode: parsed.mode === 'custom' ? 'custom' : 'default',
        onMinutes: typeof parsed.onMinutes === 'number' && parsed.onMinutes > 0 ? parsed.onMinutes : 10,
        offMinutes: typeof parsed.offMinutes === 'number' && parsed.offMinutes > 0 ? parsed.offMinutes : 5,
      };
      aerationMemory.set(machineId, config);
      return config;
    }
  } catch {
    // fallback to default config
  }
  return { ...DEFAULT_CONFIG };
}

export async function setAerationConfig(
  machineId: string,
  config: AerationConfig,
): Promise<void> {
  aerationMemory.set(machineId, config);
  try {
    await SecureStore.setItemAsync(
      `sagana_aeration_${machineId}`,
      JSON.stringify(config),
    );
  } catch {
    // fallback
  }
}
