/**
 * CreatePostModal Component
 *
 * Amaç: Post oluşturma modal'ı - Kullanıcılar buradan post paylaşabilir
 *
 * Özellikler:
 * - Text input (caption)
 * - Image picker
 * - Post types (post, mini-post, poll)
 * - Submit button
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from "react-native";
import { Image } from "expo-image";
import * as VideoThumbnails from "expo-video-thumbnails";
import { X, Send, Image as ImageIcon, Video, MapPin, Smile } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/theme/ThemeProvider";

interface MediaItem {
  uri: string;
  type: "image" | "video";
  width?: number;
  height?: number;
  thumbnailUri?: string; // Video thumbnail
  uploadProgress?: number; // Upload progress (0-100)
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { caption: string; media: MediaItem[] }) => Promise<void>;
}

export function CreatePostModal({ visible, onClose, onSubmit }: CreatePostModalProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [location, setLocation] = useState("");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için galeri erişimi gerekli.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8
    });

    if (!result.canceled && result.assets) {
      const newMedia: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: "image",
        width: asset.width,
        height: asset.height
      }));
      setMedia([...media, ...newMedia]);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Video seçmek için galeri erişimi gerekli.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: true,
      videoMaxDuration: 60,
      quality: 0.8
    });

    if (!result.canceled && result.assets) {
      // Generate thumbnails for videos
      const newMediaPromises = result.assets.map(async (asset) => {
        let thumbnailUri: string | undefined;

        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
            time: 0, // First frame
            quality: 0.8
          });
          thumbnailUri = uri;
        } catch (error) {
          console.warn("Thumbnail generation failed:", error);
        }

        return {
          uri: asset.uri,
          type: "video" as const,
          width: asset.width,
          height: asset.height,
          thumbnailUri
        };
      });

      const newMedia = await Promise.all(newMediaPromises);
      setMedia([...media, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert("Uyarı", "Lütfen bir metin veya medya ekleyin.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ caption: content, media });
      setContent("");
      setMedia([]);
      setLocation("");
      onClose();
    } catch (error) {
      console.error("Post oluşturma hatası:", error);
      Alert.alert("Hata", "Post oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} disabled={loading}>
            <X size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Yeni Gönderi</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !content.trim()}
            style={[
              styles.submitButton,
              (loading || !content.trim()) && styles.submitButtonDisabled
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Send size={20} color={content.trim() ? colors.accent : colors.textMuted} />
            )}
          </Pressable>
        </View>

        {/* Content Area */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Ne düşünüyorsun?"
            placeholderTextColor={colors.textMuted}
            multiline
            value={content}
            onChangeText={setContent}
            editable={!loading}
            maxLength={500}
          />

          {/* Character count */}
          <Text style={[styles.charCount, { color: colors.textMuted }]}>{content.length}/500</Text>

          {/* Media Preview */}
          {media.length > 0 && (
            <ScrollView
              horizontal
              style={styles.mediaPreview}
              showsHorizontalScrollIndicator={false}
            >
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image
                    source={{
                      uri: item.type === "video" && item.thumbnailUri ? item.thumbnailUri : item.uri
                    }}
                    style={styles.mediaImage}
                  />
                  <Pressable style={styles.removeMediaButton} onPress={() => removeMedia(index)}>
                    <X size={16} color="#FFF" />
                  </Pressable>
                  {item.type === "video" && (
                    <View style={styles.videoIndicator}>
                      <Video size={20} color="#FFF" />
                    </View>
                  )}
                  {item.uploadProgress !== undefined && item.uploadProgress < 100 && (
                    <View style={styles.uploadProgressOverlay}>
                      <ActivityIndicator size="large" color="#FFF" />
                      <Text style={styles.uploadProgressText}>
                        {Math.round(item.uploadProgress)}%
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Action buttons */}
          <ScrollView
            horizontal
            style={styles.actions}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsContent}
          >
            <Pressable
              style={styles.actionButton}
              onPress={pickImage}
              disabled={loading || media.length >= 10}
            >
              <ImageIcon size={20} color={colors.textSecondary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Fotoğraf</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={pickVideo}
              disabled={loading || media.length >= 10}
            >
              <Video size={20} color={colors.textSecondary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Video</Text>
            </Pressable>
            <Pressable style={styles.actionButton} disabled={loading}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Konum</Text>
            </Pressable>
            <Pressable style={styles.actionButton} disabled={loading}>
              <Smile size={20} color={colors.textSecondary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Emoji</Text>
            </Pressable>
          </ScrollView>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 18,
    fontWeight: "bold"
  },
  submitButton: {
    padding: 8
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  content: {
    flex: 1,
    padding: 16
  },
  input: {
    fontSize: 16,
    marginBottom: 8,
    minHeight: 100,
    textAlignVertical: "top"
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 16
  },
  actions: {
    marginBottom: 16
  },
  actionsContent: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  actionLabel: {
    fontSize: 14
  },
  mediaPreview: {
    marginBottom: 16
  },
  mediaItem: {
    position: "relative",
    marginRight: 8,
    borderRadius: 8,
    overflow: "hidden"
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  removeMediaButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  videoIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    padding: 4
  },
  uploadProgressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8
  },
  uploadProgressText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8
  }
});
