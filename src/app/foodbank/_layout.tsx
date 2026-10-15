import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/color";

export default function FoodBankTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // Hides the bottom navigation bar completely
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
        }}
      />
      <Tabs.Screen
        name="donations"
        options={{
          title: "Donations",
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: "Partners",
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen
        name="signup"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}