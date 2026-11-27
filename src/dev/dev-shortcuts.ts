import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

export const IS_DEV_MODE = __DEV__ && process.env.EXPO_PUBLIC_IS_DEV === 'true';

export interface DevShortcut {
  name: string;
  pathname: string;
  params?: Record<string, string>;
}

export const DEV_SHORTCUTS: DevShortcut[] = [
  {
    name: 'Dev: Machine Aeration Settings',
    pathname: '/(app)/machines/[id]/aeration-settings',
    params: { id: '1' },
  },
  {
    name: 'Dev: Machine Collect / Reject',
    pathname: '/(app)/machines/[id]/collect',
    params: { id: '1', mode: 'collect' },
  },
  {
    name: 'Dev: Batch Sensors History',
    pathname: '/(app)/history/[batchId]/sensors-history',
    params: { batchId: 'completed-1' },
  },
  {
    name: 'Dev: Onboarding',
    pathname: '/(auth)/onboarding',
  },
  {
    name: 'Dev: Open Sitemap',
    pathname: '/_sitemap',
  },
];

type DevMenuEntry = {
  name: string;
  callback: () => void;
  shouldCollapse?: boolean;
};

type DevClientModule = {
  registerDevMenuItems?: (items: DevMenuEntry[]) => Promise<void> | void;
};

export function useDevShortcuts(): void {
  const router = useRouter();

  useEffect(() => {
    if (!__DEV__ || !IS_DEV_MODE || Platform.OS === 'web') {
      return;
    }

    try {
      // Lazy-require inside __DEV__ so Metro dead-code-eliminates expo-dev-client in release builds
      const devClient = require('expo-dev-client') as DevClientModule;
      if (typeof devClient?.registerDevMenuItems !== 'function') {
        return;
      }

      const items: DevMenuEntry[] = DEV_SHORTCUTS.map((shortcut) => ({
        name: shortcut.name,
        shouldCollapse: true,
        callback: () => {
          const target = (
            shortcut.params
              ? { pathname: shortcut.pathname, params: shortcut.params }
              : shortcut.pathname
          ) as Parameters<typeof router.push>[0];
          router.push(target);
        },
      }));

      void devClient.registerDevMenuItems(items);
    } catch {
      // Ignore when running outside an expo-dev-client native binary (e.g., Expo Go)
    }
  }, [router]);
}
