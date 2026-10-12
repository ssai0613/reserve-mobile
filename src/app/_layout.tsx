import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
  PoppinsRegular: Poppins_400Regular,
  PoppinsMedium: Poppins_500Medium,
  PoppinsSemiBold: Poppins_600SemiBold,
  PoppinsBold: Poppins_700Bold,
});

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}