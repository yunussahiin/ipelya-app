/**
 * MediaPicker
 *
 * Amaç: Medya seçici (image, video, camera, file)
 * Tarih: 2025-11-26
 *
 * Kamera: VisionCamera component kullanır
 */

import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
// expo-document-picker requires development build, disabled for Expo Go
// import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { VisionCamera, type CapturedMedia } from "@/components/camera";

// =============================================
// TYPES
// =============================================

interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (media: SelectedMedia) => void;
}

export interface SelectedMedia {
  type: "image" | "video" | "file";
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

interface PickerOption {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

// =============================================
// COMPONENT
// =============================================

export function MediaPicker({ visible, onClose, onSelect }: MediaPickerProps) {
  const { colors } = useTheme();
  const [showCamera, setShowCamera] = useState(false);

  // Fotoğraf seç
  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true
    });

    if (!result.canceled && result.assets[0]) {
      onSelect({
        type: "image",
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName || "image.jpg",
        mimeType: result.assets[0].mimeType,
        fileSize: result.assets[0].fileSize
      });
      onClose();
    }
  }, [onSelect, onClose]);

  // Video seç
  const handlePickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      onSelect({
        type: "video",
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName || "video.mp4",
        mimeType: result.assets[0].mimeType,
        fileSize: result.assets[0].fileSize
      });
      onClose();
    }
  }, [onSelect, onClose]);

  // Kamera - VisionCamera aç
  const handleCamera = useCallback(() => {
    setShowCamera(true);
  }, []);

  // VisionCamera'dan medya yakalandığında
  const handleCameraCapture = useCallback(
    (media: CapturedMedia) => {
      console.log("[MediaPicker] Camera capture received:", media);

      try {
        // Normalize path - media.path zaten file:// ile başlıyorsa tekrar ekleme
        const normalizedUri = media.path.startsWith("file://")
          ? media.path
          : `file://${media.path}`;

        onSelect({
          type: media.type === "photo" ? "image" : "video",
          uri: normalizedUri,
          fileName: media.type === "photo" ? "camera.jpg" : "camera.mp4",
          mimeType: media.type === "photo" ? "image/jpeg" : "video/mp4"
        });
        console.log("[MediaPicker] onSelect called successfully, uri:", normalizedUri);
      } catch (error) {
        console.error("[MediaPicker] onSelect error:", error);
      }

      setShowCamera(false);
      onClose();
    },
    [onSelect, onClose]
  );

  // VisionCamera kapatıldığında
  const handleCameraClose = useCallback(() => {
    setShowCamera(false);
  }, []);

  // Dosya seç (requires development build)
  const handlePickFile = useCallback(async () => {
    // expo-document-picker requires development build
    // For now, show alert
    Alert.alert(
      "Geliştirme Yapısı Gerekli",
      "Dosya seçme özelliği için development build gereklidir.",
      [{ text: "Tamam" }]
    );
    // TODO: Enable when using development build
    // const result = await DocumentPicker.getDocumentAsync({
    //   type: "*/*",
    //   copyToCacheDirectory: true
    // });
    // if (!result.canceled && result.assets[0]) {
    //   onSelect({
    //     type: "file",
    //     uri: result.assets[0].uri,
    //     fileName: result.assets[0].name,
    //     mimeType: result.assets[0].mimeType,
    //     fileSize: result.assets[0].size
    //   });
    //   onClose();
    // }
  }, []);

  const options: PickerOption[] = [
    { icon: "camera", label: "Kamera", onPress: handleCamera },
    { icon: "image", label: "Fotoğraf", onPress: handlePickImage },
    { icon: "videocam", label: "Video", onPress: handlePickVideo },
    { icon: "document", label: "Dosya", onPress: handlePickFile }
  ];

  // VisionCamera açıksa, sadece kamerayı göster
  if (showCamera) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleCameraClose}>
        <VisionCamera
          mode="photo"
          initialPosition="back"
          enableAudio={true}
          showControls={true}
          onCapture={handleCameraCapture}
          onClose={handleCameraClose}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.options}>
            {options.map((option) => (
              <Pressable key={option.label} style={styles.option} onPress={option.onPress}>
                <View style={[styles.optionIcon, { backgroundColor: colors.backgroundRaised }]}>
                  <Ionicons name={option.icon} size={28} color={colors.accent} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.cancelButton, { backgroundColor: colors.backgroundRaised }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textPrimary }]}>İptal</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  option: {
    alignItems: "center"
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8
  },
  optionLabel: {
    fontSize: 12
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600"
  }
});

export default MediaPicker;
