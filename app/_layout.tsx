import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/expo';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, Pressable } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetwork } from '@/hooks/use-network';
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
import { hasSeenOnboarding, subscribeOnboarding } from '@/lib/onboarding-storage';
import { useDevShortcuts } from '@/dev/dev-shortcuts';
import {
  requestNotificationPermissions,
  setupNotificationListeners,
} from '@/lib/notifications';

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
  const { isSignedIn, isLoaded, user, signupBarangay, signOut } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();
  useDevShortcuts();
  const queryClient = useQueryClient();
  const { isOffline } = useNetwork();
  const [onboardingStatus, setOnboardingStatus] = useState<{ checked: boolean; seen: boolean }>({
    checked: false,
    seen: false,
  });

  useEffect(() => {
    let isMounted = true;
    hasSeenOnboarding()
      .then((seen) => {
        if (isMounted) {
          setOnboardingStatus({ checked: true, seen });
        }
      })
      .catch((error) => {
        authGateLogger.warn('Failed to read onboarding state from storage:', error);
      });
    const unsubscribe = subscribeOnboarding((seen) => {
      if (isMounted) {
        setOnboardingStatus({ checked: true, seen });
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
    if (isSignedIn) {
      void requestNotificationPermissions();
      return setupNotificationListeners();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (segments.length > 0) {
      navLogger.screen(segments.join('/'));
    }
  }, [segments]);

  useEffect(() => {
    if (!isLoaded || (!isSignedIn && !onboardingStatus.checked)) return;
    
    // Clerk updates `isSignedIn` immediately, but `user` (clerkUser) might take a tick to fetch.
    // Wait until the user object is fully loaded before making routing decisions.
    if (isSignedIn && (!user || profile.isPending || profile.isError)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isSuspended = profile.data?.status === 'suspended';

    authGateLogger.info(
      `AuthGate evaluation: dbStatus=${profile.data?.status}, isSuspended=${isSuspended}`
    );

    const destination = signupDestination(
      Boolean(profile.data?.barangayId),
      Boolean(user?.birthday),
      Boolean(signupBarangay),
      isSuspended,
    );

    if (!isSignedIn) {
      queryClient.removeQueries({ queryKey: ['signup-profile'] });
      const currentAuthScreen = segments.at(1) as string | undefined;

      if (!onboardingStatus.seen) {
        if (currentAuthScreen !== 'splash' && currentAuthScreen !== 'onboarding') {
          authGateLogger.info('Unseen onboarding redirected to splash');
          queryClient.clear();
          router.replace('/(auth)/splash');
        }
      } else {
        if (
          !inAuthGroup ||
          currentAuthScreen === 'splash' ||
          currentAuthScreen === 'onboarding' ||
          currentAuthScreen === 'suspended'
        ) {
          authGateLogger.info('Returning unauthenticated user redirected to sign-in');
          queryClient.clear();
          router.replace('/(auth)/sign-in');
        }
      }
    } else if (isSignedIn && destination === 'suspended') {
      if (!inAuthGroup || segments.at(1) !== 'suspended') {
        authGateLogger.warn('Suspended operator redirected to suspended screen');
        router.replace('/(auth)/suspended');
      }
    } else if (isSignedIn && destination === 'code') {
      if (!inAuthGroup || segments.at(1) !== 'barangay-code') router.replace('/(auth)/barangay-code');
    } else if (isSignedIn && destination === 'app') {
      const isAlreadyOnSignUp = segments[0] === '(auth)' && segments.at(1) === 'sign-up';
      if (inAuthGroup && !isAlreadyOnSignUp) {
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
  }, [isSignedIn, isLoaded, user, segments, router, queryClient, profile.data, profile.isPending, profile.isError, signupBarangay, onboardingStatus]);

  const isSuspended = profile.data?.status === 'suspended';
  const isOfflinePending = isSignedIn && profile.isPending && (profile.isPaused || isOffline);
  const showLoading =
    isSignedIn &&
    !isOfflinePending &&
    (!user ||
      profile.isPending ||
      (!isSuspended && !profile.data?.barangayId) ||
      (isSuspended && segments.at(1) !== 'suspended')) &&
    (segments[0] !== '(auth)' || (isSuspended && segments.at(1) !== 'suspended'));
  const showError = isSignedIn && profile.isError && !isOfflinePending;

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      {(showLoading || showError || isOfflinePending) && (
        <View className="absolute inset-0 bg-background">
          {isOfflinePending ? (
            <View className="flex-1 justify-center items-center px-6 gap-3">
              <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-2">
                <WifiOff size={32} color="#718619" />
              </View>
              <Text className="text-foreground text-xl font-bold text-center">
                You are offline
              </Text>
              <Text className="text-muted-foreground text-sm font-sans text-center max-w-70">
                Please connect to the internet to load your account and continue.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void profile.refetch()}
                className="mt-4 px-6 py-3 rounded-full bg-primary items-center justify-center active:opacity-90 w-full max-w-70"
              >
                <Text className="text-primary-foreground font-bold text-sm">Try again</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void signOut()}
                className="py-2 active:opacity-70"
              >
                <Text className="text-muted-foreground text-sm font-medium">Sign out</Text>
              </Pressable>
            </View>
          ) : showError ? (
            <View className="flex-1 justify-center px-6 gap-4">
              <Text className="text-foreground text-lg font-bold">Unable to load your profile</Text>
              <Text className="text-muted-foreground font-sans">Check your connection and try again.</Text>
              <Pressable accessibilityRole="button" onPress={() => void profile.refetch()}><Text className="text-primary font-bold">Try again</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void signOut()}><Text className="text-foreground font-sans">Sign out</Text></Pressable>
            </View>
          ) : <LoadingScreen />}
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected && !!state.isInternetReachable);
      });
    });
  }, []);

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
