import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'sagana_has_seen_onboarding';

type Listener = (seen: boolean) => void;
const listeners = new Set<Listener>();

let memoryCache: boolean | null = null;

export async function hasSeenOnboarding(): Promise<boolean> {
  if (memoryCache !== null) return memoryCache;
  try {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    memoryCache = value === 'true';
    return memoryCache;
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  memoryCache = true;
  listeners.forEach((fn) => fn(true));
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
  } catch {
    // fallback or noop
  }
}

export async function resetOnboarding(): Promise<void> {
  memoryCache = false;
  listeners.forEach((fn) => fn(false));
  try {
    await SecureStore.deleteItemAsync(ONBOARDING_KEY);
  } catch {
    // noop
  }
}

export function subscribeOnboarding(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
