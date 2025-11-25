import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export default function StoreLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Mağaza",
          headerLargeTitle: true
        }}
      />
      <Stack.Screen
        name="coins"
        options={{
          title: "Coin Satın Al",
          presentation: "modal"
        }}
      />
      <Stack.Screen
        name="subscription"
        options={{
          title: "Premium Abonelik",
          presentation: "modal"
        }}
      />
    </Stack>
  );
}
