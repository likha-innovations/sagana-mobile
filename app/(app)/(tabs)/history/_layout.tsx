export const unstable_settings = { initialRouteName: "index" };
import { Stack } from "expo-router";
export default function HistoryLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
