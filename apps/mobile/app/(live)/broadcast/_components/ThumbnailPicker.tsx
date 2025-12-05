/**
 * ThumbnailPicker Component
 * Yayın thumbnail'i seçme/yükleme bileşeni
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useBroadcastThumbnails, type BroadcastThumbnail } from "@/hooks/live";

interface ThumbnailPickerProps {
  selectedUrl?: string;
  onSelect: (url: string | undefined) => void;
  /** Kullanıcının avatar URL'i - thumbnail yoksa gösterilir */
  avatarUrl?: string;
}

export function ThumbnailPicker({ selectedUrl, onSelect, avatarUrl }: ThumbnailPickerProps) {
  const { colors } = useTheme();
  const { thumbnails, isLoading, isUploading, uploadThumbnail, deleteThumbnail } =
    useBroadcastThumbnails();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    const result = await uploadThumbnail();
    if (result) {
      onSelect(result.thumbnailUrl);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Thumbnail Sil", "Bu thumbnail'i silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const thumbnail = thumbnails.find((t) => t.id === id);
          await deleteThumbnail(id);
          if (thumbnail?.thumbnailUrl === selectedUrl) {
            onSelect(undefined);
          }
        }
      }
    ]);
  };

  const handleThumbnailPress = (url: string) => {
    onSelect(url);
  };

  const handleThumbnailLongPress = (thumbnail: BroadcastThumbnail) => {
    Alert.alert("Thumbnail İşlemleri", undefined, [
      { text: "Büyük Göster", onPress: () => setPreviewUrl(thumbnail.thumbnailUrl) },
      { text: "Sil", style: "destructive", onPress: () => handleDelete(thumbnail.id) },
      { text: "İptal", style: "cancel" }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Yayın Kapak Görseli</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          İzleyiciler yayınınızı listede bu görselle görecek
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailList}
      >
        {/* Upload Button */}
        <Pressable
          style={[
            styles.uploadButton,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
          onPress={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
              <Text style={[styles.uploadText, { color: colors.textMuted }]}>Yükle</Text>
            </>
          )}
        </Pressable>

        {/* Avatar Option (thumbnail yoksa varsayılan) */}
        {avatarUrl && (
          <Pressable
            style={[
              styles.thumbnailItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !selectedUrl && styles.selectedThumbnail
            ]}
            onPress={() => onSelect(undefined)}
          >
            <Image source={{ uri: avatarUrl }} style={styles.thumbnailImage} />
            <View style={[styles.avatarBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={8} color="#fff" />
            </View>
            {!selectedUrl && (
              <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </Pressable>
        )}

        {/* Saved Thumbnails */}
        {thumbnails.map((thumbnail) => (
          <Pressable
            key={thumbnail.id}
            style={[
              styles.thumbnailItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedUrl === thumbnail.thumbnailUrl && styles.selectedThumbnail
            ]}
            onPress={() => handleThumbnailPress(thumbnail.thumbnailUrl)}
            onLongPress={() => handleThumbnailLongPress(thumbnail)}
          >
            <Image source={{ uri: thumbnail.thumbnailUrl }} style={styles.thumbnailImage} />
            {thumbnail.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="star" size={8} color="#fff" />
              </View>
            )}
            {selectedUrl === thumbnail.thumbnailUrl && (
              <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}

        {/* Loading Skeleton */}
        {isLoading && (
          <View style={[styles.thumbnailItem, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}
      </ScrollView>

      {thumbnails.length > 0 && (
        <Text style={[styles.tipText, { color: colors.textMuted }]}>
          💡 Büyütmek veya silmek için basılı tutun
        </Text>
      )}

      {/* Preview Modal */}
      <Modal
        visible={!!previewUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUrl(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewUrl(null)}>
          <View style={styles.modalContent}>
            {previewUrl && (
              <Image
                source={{ uri: previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            <Pressable style={styles.closeButton} onPress={() => setPreviewUrl(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16
  },
  header: {
    marginBottom: 12
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4
  },
  hint: {
    fontSize: 13
  },
  thumbnailList: {
    paddingVertical: 4,
    gap: 12
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4
  },
  uploadText: {
    fontSize: 11,
    fontWeight: "500"
  },
  thumbnailItem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  selectedThumbnail: {
    borderColor: "#FF2D55",
    borderWidth: 2
  },
  thumbnailImage: {
    width: "100%",
    height: "100%"
  },
  noThumbnail: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  thumbnailLabel: {
    position: "absolute",
    bottom: 4,
    fontSize: 10,
    fontWeight: "500"
  },
  checkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  defaultBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  tipText: {
    fontSize: 11,
    marginTop: 8,
    textAlign: "center"
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  previewImage: {
    width: "90%",
    height: "70%"
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  }
});

export default ThumbnailPicker;
