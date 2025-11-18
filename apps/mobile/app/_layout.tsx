import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

function AppStack() {
  const { scheme, colors } = useTheme();

  return (
    <>
      <StatusBar
        style={scheme === "dark" ? "light" : "dark"}
        backgroundColor={colors.background}
        translucent
        animated
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: colors.background }
          }}
        />
      </View>
    </>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppStack />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
