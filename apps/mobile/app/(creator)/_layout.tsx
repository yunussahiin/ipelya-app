import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Compass, LayoutDashboard, DollarSign, Calendar, Upload } from "lucide-react-native";

export default function CreatorLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: Platform.OS === "ios" ? "transparent" : colors.navBackground
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={80} tint={colors.navBlurTint} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navBackground }]} />
          ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -2
        },
        tabBarIconStyle: {
          marginTop: 4
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Panel",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: "Gelir",
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Takvim",
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Yükle",
          tabBarIcon: ({ color, size }) => <Upload size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
