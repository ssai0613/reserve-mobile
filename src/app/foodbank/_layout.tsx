import { Stack } from "expo-router";

export default function FoodBankLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="donations" />
      <Stack.Screen name="partners" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}