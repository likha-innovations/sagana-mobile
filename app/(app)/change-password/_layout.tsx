import { Stack } from 'expo-router';

export default function ChangePasswordLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="current-password" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
