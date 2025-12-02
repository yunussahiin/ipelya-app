/**
 * ActionButtons
 * Amaç: Profil, Ara, Sessize Al, Seçenekler butonları
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { User, Search, Bell, BellOff, MoreHorizontal } from "lucide-react-native";

interface ActionButtonsProps {
  isMuted?: boolean;
  onProfilePress: () => void;
  onSearchPress: () => void;
  onMutePress: () => void;
  onMorePress: () => void;
}

export function ActionButtons({
  isMuted = false,
  onProfilePress,
  onSearchPress,
  onMutePress,
  onMorePress
}: ActionButtonsProps) {
  const { colors } = useTheme();

  const actions = [
    { icon: User, label: "Profil", onPress: onProfilePress },
    { icon: Search, label: "Ara", onPress: onSearchPress },
    {
      icon: isMuted ? Bell : BellOff,
      label: isMuted ? "Sesi Aç" : "Sessize Al",
      onPress: onMutePress
    },
    { icon: MoreHorizontal, label: "Seçenekler", onPress: onMorePress }
  ];

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <Pressable key={index} style={styles.actionButton} onPress={action.onPress}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
            <action.icon size={22} color={colors.textPrimary} />
          </View>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: 16
  },
  actionButton: {
    alignItems: "center",
    gap: 6
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  label: {
    fontSize: 12,
    fontWeight: "500"
  }
});
