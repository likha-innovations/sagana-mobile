import {
  HomeSolid,
  MachinesSolid,
  HistorySolid,
  AccountSolid,
} from "@/components/navigation/tab-icons";
import { Tabs } from "expo-router";
import { House, Box, User, ChartColumnBig } from "lucide-react-native";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) =>
            focused ? (
              <HomeSolid color={color} width={size} height={size} />
            ) : (
              <House color={color} size={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="machines"
        options={{
          title: "Machines",
          popToTopOnBlur: true,
          tabBarIcon: ({ focused, color, size }) =>
            focused ? (
              <MachinesSolid color={color} width={size} height={size} />
            ) : (
              <Box color={color} size={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused, color, size }) =>
            focused ? (
              <HistorySolid color={color} width={size} height={size} />
            ) : (
              <ChartColumnBig color={color} size={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ focused, color, size }) =>
            focused ? (
              <AccountSolid color={color} width={size} height={size} />
            ) : (
              <User color={color} size={size} />
            ),
        }}
      />
    </Tabs>
  );
}
