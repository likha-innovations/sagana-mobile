import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { tokenCache } from '@/lib/token-cache';
import { AuthProvider, useAuthContext } from '@/context/auth-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createLogger } from '@/lib/logger';

const logger = createLogger('RootLayout');
const authGateLogger = createLogger('AuthGate');
const navLogger = createLogger('Navigation');

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  logger.error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.'
  );
}

function AuthProtectedNavigation() {
  const { isSignedIn, isLoaded } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (segments.length > 0) {
      navLogger.screen(segments.join('/'));
    }
  }, [segments]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      authGateLogger.info('Unauthenticated user redirected to sign-in');
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      authGateLogger.info('Authenticated user redirected to app tabs');
      router.replace('/(app)/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 mins
            retry: 2,
          },
        },
      })
  );

  const [fontsLoaded, fontError] = useFonts({
    'SpotifyMix-Regular': require('../assets/fonts/SpotifyMix-Regular.ttf'),
    'SpotifyMix-Medium': require('../assets/fonts/SpotifyMix-Medium.ttf'),
    'SpotifyMix-Bold': require('../assets/fonts/SpotifyMix-Bold.ttf'),
    'SpotifyMix-Extrabold': require('../assets/fonts/SpotifyMix-Extrabold.ttf'),
    'SpotifyMix-Black': require('../assets/fonts/SpotifyMix-Black.ttf'),
    'SpotifyMix-Light': require('../assets/fonts/SpotifyMix-Light.ttf'),
    'SpotifyMix-Thin': require('../assets/fonts/SpotifyMix-Thin.ttf'),
    'Montserrat-Regular': require('../assets/fonts/SpotifyMix-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/SpotifyMix-Medium.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/SpotifyMix-Bold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/SpotifyMix-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      logger.bootstrap('Sagana Mobile UI initialized');
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={publishableKey ?? ''}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <AuthProtectedNavigation />
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
