import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/expo';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, Pressable } from 'react-native';
import { userApi } from '@/api/user.api';
import { setForbiddenHandler } from '@/api/client';
import { signupDestination } from '@/lib/barangay-code';
import { useFonts } from 'expo-font';
import { tokenCache } from '@/lib/token-cache';
import { AuthProvider, useAuthContext } from '@/context/auth-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Toast } from '@/components/ui/toast';
import { createLogger } from '@/lib/logger';
import { LoadingScreen } from '@/components/ui/loading-screen';

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
  const { isSignedIn, isLoaded, user, clerkUser, signupBarangay, signOut } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ['signup-profile', user?.id],
    queryFn: userApi.getProfile,
    enabled: !!isSignedIn && !!user?.id,
    retry: 1,
    refetchInterval: 60000,
  });

  useEffect(() => {
    setForbiddenHandler(() => {
      void queryClient.invalidateQueries({ queryKey: ['signup-profile', user?.id] });
    });
    return () => setForbiddenHandler(null);
  }, [queryClient, user?.id]);

  useEffect(() => {
    if (segments.length > 0) {
      navLogger.screen(segments.join('/'));
    }
  }, [segments]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Clerk updates `isSignedIn` immediately, but `user` (clerkUser) might take a tick to fetch.
    // Wait until the user object is fully loaded before making routing decisions.
    if (isSignedIn && (!user || profile.isLoading || profile.isError)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isSuspended =
      profile.data?.status === 'suspended' ||
      (clerkUser?.publicMetadata as Record<string, unknown> | undefined)?.status === 'suspended';

    authGateLogger.info(
      `AuthGate evaluation: dbStatus=${profile.data?.status}, clerkStatus=${(clerkUser?.publicMetadata as Record<string, unknown> | undefined)?.status}, isSuspended=${isSuspended}`
    );

    const destination = signupDestination(
      Boolean(profile.data?.barangayId),
      Boolean(user?.birthday),
      Boolean(signupBarangay),
      isSuspended,
    );

    if (!isSignedIn) {
      queryClient.removeQueries({ queryKey: ['signup-profile'] });
      if (!inAuthGroup || segments.at(1) === 'suspended') {
        authGateLogger.info('Unauthenticated user redirected to sign-in');
        queryClient.clear();
        router.replace('/(auth)/sign-in');
      }
    } else if (isSignedIn && destination === 'suspended') {
      if (!inAuthGroup || segments.at(1) !== 'suspended') {
        authGateLogger.warn('Suspended operator redirected to suspended screen');
        router.replace('/(auth)/suspended');
      }
    } else if (isSignedIn && destination === 'code') {
      if (!inAuthGroup || segments.at(1) !== 'barangay-code') router.replace('/(auth)/barangay-code');
    } else if (isSignedIn && destination === 'app') {
      if (inAuthGroup) {
        authGateLogger.info('Authenticated user with complete profile redirected to app tabs');
        router.replace('/(app)/(tabs)');
      }
    } else if (isSignedIn && destination === 'signup') {
      const isAlreadyOnSignUp = segments[0] === '(auth)' && segments.at(1) === 'sign-up';
      if (!isAlreadyOnSignUp) {
        authGateLogger.info('Authenticated user without complete profile redirected to sign-up to complete onboarding');
        router.replace('/(auth)/sign-up');
      }
    }
  }, [isSignedIn, isLoaded, user, segments, router, queryClient, profile.data, profile.isLoading, profile.isError, signupBarangay]);

  const isSuspended =
    profile.data?.status === 'suspended' ||
    (clerkUser?.publicMetadata as Record<string, unknown> | undefined)?.status === 'suspended';
  const showLoading =
    isSignedIn &&
    (!user ||
      profile.isLoading ||
      (!isSuspended && !profile.data?.barangayId) ||
      (isSuspended && segments.at(1) !== 'suspended')) &&
    (segments[0] !== '(auth)' || (isSuspended && segments.at(1) !== 'suspended'));
  const showError = isSignedIn && profile.isError;

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      {(showLoading || showError) && (
        <View className="absolute inset-0 bg-background">
          {showError ? (
            <View className="flex-1 justify-center px-6 gap-4">
              <Text className="text-foreground text-lg font-bold">Unable to load your profile</Text>
              <Text className="text-muted-foreground">Check your connection and try again.</Text>
              <Pressable accessibilityRole="button" onPress={() => void profile.refetch()}><Text className="text-primary font-bold">Try again</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void signOut()}><Text className="text-foreground">Sign out</Text></Pressable>
            </View>
          ) : <LoadingScreen />}
        </View>
      )}
    </View>
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
        <ClerkLoading><LoadingScreen /></ClerkLoading>
        <ClerkLoaded>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <AuthProtectedNavigation />
                <Toast />
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
