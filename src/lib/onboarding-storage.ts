import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'sagana_has_seen_onboarding';

type Listener = (seen: boolean) => void;
const listeners = new Set<Listener>();

let memoryCache: boolean | null = null;

function notifyListeners(seen: boolean) {
  listeners.forEach((fn) => {
    try {
      fn(seen);
    } catch {
      // noop
    }
  });
}

export async function hasSeenOnboarding(): Promise<boolean> {
  if (memoryCache !== null) return memoryCache;
  try {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    const seen = value === 'true';
    memoryCache = seen;
    notifyListeners(seen);
    return seen;
  } catch (error) {
    // Keep failed read distinct from confirmed missing key
    throw error;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  memoryCache = true;
  notifyListeners(true);
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
  } catch {
    // fallback or noop
  }
}

export async function resetOnboarding(): Promise<void> {
  memoryCache = false;
  notifyListeners(false);
  try {
    await SecureStore.deleteItemAsync(ONBOARDING_KEY);
  } catch {
    // noop
  }
}

export function subscribeOnboarding(fn: Listener): () => void {
  listeners.add(fn);
  if (memoryCache !== null) {
    fn(memoryCache);
  }
  return () => {
    listeners.delete(fn);
  };
}
