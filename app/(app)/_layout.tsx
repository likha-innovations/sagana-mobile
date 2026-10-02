import { Stack, Redirect } from 'expo-router';
import { useAuthContext } from '@/context/auth-context';

export default function AppLayout() {
  const { isSignedIn, isLoaded, user } = useAuthContext();

  if (!isLoaded) return null;

  if (!isSignedIn || !user?.birthday) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
    </Stack>
  );
}
