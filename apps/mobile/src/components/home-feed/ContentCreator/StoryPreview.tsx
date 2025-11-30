/**
 * StoryPreview Component
 *
 * Instagram tarzı hikaye önizleme ve paylaşım ekranı
 * - Tam ekran medya önizleme
 * - Üstte araç çubuğu (emoji, mention, text, sticker, müzik)
 * - Altta açıklama girişi ve paylaşım seçenekleri
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Text, TextInput, Keyboard, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from "react-native-reanimated";

const AnimatedView = Animated.View;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  X,
  Smile,
  AtSign,
  Type,
  Sticker,
  Music,
  MoreHorizontal,
  ArrowRight,
  Users
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfileStore } from "@/store/profile.store";

interface StoryPreviewProps {
  media: {
    uri: string;
    type: "photo" | "video";
    width: number;
    height: number;
    duration?: number;
  };
  onBack: () => void;
  onShare: (caption?: string) => void;
}

export function StoryPreview({ media, onBack, onShare }: StoryPreviewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);

  const [caption, setCaption] = useState("");

  // Video player (expo-video)
  const player = useVideoPlayer(media.type === "video" ? media.uri : null, (player) => {
    player.loop = true;
    player.play();
  });

  // Klavye yüksekliği için animated value
  const keyboardOffset = useSharedValue(0);

  // Klavye event listener'ları
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, {
        duration: 250,
        easing: Easing.out(Easing.ease)
      });
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease)
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Bottom section animated style
  const bottomAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOffset.value }]
  }));

  // Paylaş butonuna tıklandığında
  const handleShare = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onShare(caption || undefined);
  };

  // Toolbar butonları
  const toolbarButtons = [
    { icon: Smile, label: "Emoji" },
    { icon: AtSign, label: "Mention" },
    { icon: Type, label: "Text" },
    { icon: Sticker, label: "Sticker" },
    { icon: Music, label: "Music" },
    { icon: MoreHorizontal, label: "More" }
  ];

  return (
    <View style={styles.container}>
      {/* Full screen media preview */}
      <View style={styles.mediaContainer}>
        {media.type === "photo" ? (
          <Image source={{ uri: media.uri }} style={styles.mediaImage} contentFit="cover" />
        ) : (
          <VideoView
            player={player}
            style={styles.mediaVideo}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        {/* Gradient overlay - top */}
        <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={styles.topGradient} />

        {/* Gradient overlay - bottom */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.bottomGradient} />
      </View>

      {/* Top toolbar */}
      <View style={[styles.topToolbar, { paddingTop: insets.top + 8 }]}>
        {/* Close button */}
        <Pressable style={styles.toolbarButton} onPress={onBack}>
          <X size={28} color="#FFF" />
        </Pressable>

        {/* Toolbar actions */}
        <View style={styles.toolbarActions}>
          {toolbarButtons.map((button, index) => (
            <Pressable
              key={index}
              style={styles.toolbarIconButton}
              onPress={() => Haptics.selectionAsync()}
            >
              <button.icon size={24} color="#FFF" />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bottom section - klavye açılınca yukarı kayar */}
      <AnimatedView
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }, bottomAnimatedStyle]}
      >
        {/* Caption input */}
        <TextInput
          style={styles.captionInput}
          placeholder="Açıklama ekle..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />

        {/* Share options */}
        <View style={styles.shareOptions}>
          {/* Your Story button */}
          <Pressable style={styles.shareButton} onPress={handleShare}>
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceAlt }]} />
            )}
            <Text style={styles.shareButtonText}>Hikayen</Text>
          </Pressable>

          {/* Close Friends button */}
          <Pressable style={[styles.shareButton, styles.closeFriendsButton]}>
            <View style={styles.closeFriendsIcon}>
              <Users size={18} color="#FFF" />
            </View>
            <Text style={styles.shareButtonText}>Yakın Arkada...</Text>
          </Pressable>

          {/* Send button */}
          <Pressable style={styles.sendButton} onPress={handleShare}>
            <ArrowRight size={24} color="#000" />
          </Pressable>
        </View>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject
  },
  mediaImage: {
    width: "100%",
    height: "100%"
  },
  mediaVideo: {
    width: "100%",
    height: "100%"
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 250
  },
  topToolbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 10
  },
  toolbarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  toolbarActions: {
    flexDirection: "row",
    gap: 8
  },
  toolbarIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10
  },
  captionInput: {
    color: "#FFF",
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 16
  },
  shareOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8
  },
  closeFriendsButton: {
    backgroundColor: "rgba(0,150,80,0.8)"
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  closeFriendsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00C853",
    alignItems: "center",
    justifyContent: "center"
  },
  shareButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  sendButton: {
    marginLeft: "auto",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center"
  }
});
