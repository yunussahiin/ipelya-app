/**
 * BroadcastMediaPicker
 *
 * Amaç: Yayın kanalı için medya seçici (resim, video, ses)
 * Tarih: 2025-12-02
 *
 * Özellikler:
 * - Galeri'den resim/video seçimi
 * - Kamera ile fotoğraf/video çekimi
 * - Ses kaydı
 * - Medya önizleme
 */

import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Alert } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image as ImageIcon, Video, Mic, Camera, X, Send } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { BroadcastVoiceRecorder } from "../BroadcastVoiceRecorder";

// Medya türleri
export type MediaType = "image" | "video" | "voice";

// Seçilen medya
export interface SelectedMedia {
  type: MediaType;
  uri: string;
  mimeType?: string;
  duration?: number; // Video/ses için süre (ms)
  width?: number;
  height?: number;
}

interface BroadcastMediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (media: SelectedMedia) => void;
}

export function BroadcastMediaPicker({ visible, onClose, onSelect }: BroadcastMediaPickerProps) {
  const { colors } = useTheme();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);

  // Galeri'den resim seç
  const pickImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Galeri erişimi için izin vermeniz gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3]
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({
        type: "image",
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
        width: asset.width,
        height: asset.height
      });
    }
  }, []);

  // Galeri'den video seç
  const pickVideo = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Galeri erişimi için izin vermeniz gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60 // Max 60 saniye
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({
        type: "video",
        uri: asset.uri,
        mimeType: asset.mimeType || "video/mp4",
        duration: asset.duration,
        width: asset.width,
        height: asset.height
      });
    }
  }, []);

  // Kamera ile fotoğraf çek
  const takePhoto = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Kamera erişimi için izin vermeniz gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({
        type: "image",
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
        width: asset.width,
        height: asset.height
      });
    }
  }, []);

  // Ses kaydı tamamlandığında
  const handleVoiceRecorded = useCallback((uri: string, duration: number) => {
    setSelectedMedia({
      type: "voice",
      uri,
      mimeType: "audio/m4a",
      duration
    });
    setShowVoiceRecorder(false);
  }, []);

  // Medya gönder
  const handleSend = useCallback(() => {
    if (selectedMedia) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(selectedMedia);
      setSelectedMedia(null);
      onClose();
    }
  }, [selectedMedia, onSelect, onClose]);

  // İptal
  const handleCancel = useCallback(() => {
    setSelectedMedia(null);
    setShowVoiceRecorder(false);
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      </Pressable>

      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.handle} />

        {/* Başlık */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {selectedMedia ? "Önizleme" : showVoiceRecorder ? "Ses Kaydı" : "Medya Ekle"}
          </Text>
          <Pressable onPress={handleCancel}>
            <X size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* İçerik */}
        {showVoiceRecorder ? (
          <BroadcastVoiceRecorder
            onRecorded={handleVoiceRecorded}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : selectedMedia ? (
          /* Önizleme */
          <View style={styles.previewContainer}>
            {selectedMedia.type === "image" && (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.previewImage}
                contentFit="contain"
              />
            )}
            {selectedMedia.type === "video" && (
              <View style={styles.videoPreview}>
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.previewImage}
                  contentFit="contain"
                />
                <View style={styles.videoBadge}>
                  <Video size={16} color="#fff" />
                  <Text style={styles.videoDuration}>
                    {Math.round((selectedMedia.duration || 0) / 1000)}s
                  </Text>
                </View>
              </View>
            )}
            {selectedMedia.type === "voice" && (
              <View style={[styles.voicePreview, { backgroundColor: colors.backgroundRaised }]}>
                <Mic size={40} color={colors.accent} />
                <Text style={[styles.voiceDuration, { color: colors.textPrimary }]}>
                  {Math.round((selectedMedia.duration || 0) / 1000)} saniye
                </Text>
              </View>
            )}

            {/* Gönder butonu */}
            <Pressable
              style={[styles.sendButton, { backgroundColor: colors.accent }]}
              onPress={handleSend}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Gönder</Text>
            </Pressable>
          </View>
        ) : (
          /* Seçenekler */
          <View style={styles.options}>
            <Pressable
              style={[styles.option, { backgroundColor: colors.backgroundRaised }]}
              onPress={pickImage}
            >
              <ImageIcon size={28} color={colors.accent} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Resim</Text>
            </Pressable>

            <Pressable
              style={[styles.option, { backgroundColor: colors.backgroundRaised }]}
              onPress={pickVideo}
            >
              <Video size={28} color={colors.accent} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Video</Text>
            </Pressable>

            <Pressable
              style={[styles.option, { backgroundColor: colors.backgroundRaised }]}
              onPress={takePhoto}
            >
              <Camera size={28} color={colors.accent} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Kamera</Text>
            </Pressable>

            <Pressable
              style={[styles.option, { backgroundColor: colors.backgroundRaised }]}
              onPress={() => setShowVoiceRecorder(true)}
            >
              <Mic size={28} color={colors.accent} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Ses</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    minHeight: 300
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
    alignSelf: "center",
    marginTop: 12
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 12,
    justifyContent: "center"
  },
  option: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  optionText: {
    fontSize: 12,
    fontWeight: "500"
  },
  previewContainer: {
    padding: 20,
    alignItems: "center"
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12
  },
  videoPreview: {
    width: "100%",
    position: "relative"
  },
  videoBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  videoDuration: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500"
  },
  voicePreview: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 12
  },
  voiceDuration: {
    fontSize: 16,
    fontWeight: "600"
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    gap: 8
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});

export default BroadcastMediaPicker;
