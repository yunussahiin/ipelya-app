/**
 * DetailsHeader
 * Amaç: Detay sayfası header
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { ChevronLeft } from "lucide-react-native";

export function DetailsHeader() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={28} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  }
});
