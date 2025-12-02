/**
 * AudioPlayerModal
 * Amaç: Ses dosyası oynatma modal'ı
 */

import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { X } from "lucide-react-native";
import { AudioPlayer } from "@/components/messaging/ChatScreen/components/AudioPlayer";

interface AudioPlayerModalProps {
  visible: boolean;
  audioUrl: string | null;
  duration?: number;
  onClose: () => void;
}

export function AudioPlayerModal({ visible, audioUrl, duration, onClose }: AudioPlayerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !audioUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Ses Kaydı</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Audio Player */}
          <View style={styles.playerContainer}>
            <AudioPlayer uri={audioUrl} duration={duration} colors={colors} isOwnMessage={false} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  playerContainer: {
    paddingVertical: 20
  }
});
