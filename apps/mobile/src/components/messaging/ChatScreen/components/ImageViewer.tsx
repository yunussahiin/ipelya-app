/**
 * ImageViewer (MediaViewer)
 *
 * WhatsApp tarzı full-screen image/video viewer
 * - Swipe ile medya değiştirme
 * - Thumbnail gallery
 * - Gönderen bilgisi + tarih
 * - Video playback desteği (expo-video)
 */

import { memo, useMemo, useRef, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { IMessage } from "react-native-gifted-chat";
import dayjs from "dayjs";
import { VideoThumbnail } from "./VideoThumbnail";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Playback rate options
const PLAYBACK_RATES = [0.5, 1, 1.5, 2];

/**
 * Video Player Component - expo-video ile
 * Features: PiP, Native Controls, Playback Rate
 */
function VideoPlayer({ uri, isActive }: { uri: string; isActive: boolean }) {
  const videoViewRef = useRef<any>(null);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.playbackRate = 1;
    if (isActive) {
      player.play();
    }
  });

  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  // isActive değiştiğinde play/pause
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  }, [isPlaying, player]);

  const cyclePlaybackRate = useCallback(() => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];
    player.playbackRate = newRate;
    setPlaybackRate(newRate);
    console.log("[VideoPlayer] Playback rate changed:", newRate);
  }, [playbackRate, player]);

  const togglePiP = useCallback(async () => {
    try {
      await videoViewRef.current?.startPictureInPicture();
      console.log("[VideoPlayer] PiP started");
    } catch (err) {
      console.log("[VideoPlayer] PiP not supported or failed:", err);
    }
  }, []);

  return (
    <View style={videoStyles.container}>
      <VideoView
        ref={videoViewRef}
        player={player}
        style={videoStyles.video}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen
        allowsPictureInPicture
      />

      {/* Tap to show/hide controls */}
      <Pressable style={videoStyles.overlay} onPress={() => setShowControls(!showControls)}>
        {/* Play/Pause button - always visible when paused or controls shown */}
        {(!isPlaying || showControls) && (
          <TouchableOpacity style={videoStyles.playButton} onPress={togglePlayPause}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Top controls - Playback rate & PiP */}
        {showControls && (
          <View style={videoStyles.topControls}>
            {/* Playback Rate */}
            <TouchableOpacity style={videoStyles.controlButton} onPress={cyclePlaybackRate}>
              <Text style={videoStyles.rateText}>{playbackRate}x</Text>
            </TouchableOpacity>

            {/* PiP Button */}
            <TouchableOpacity style={videoStyles.controlButton} onPress={togglePiP}>
              <Ionicons name="browsers-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom controls - Progress indicator */}
        {showControls && (
          <View style={videoStyles.bottomControls}>
            <Text style={videoStyles.controlText}>
              {isPlaying ? "Oynatılıyor" : "Duraklatıldı"}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const videoStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000"
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center"
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  topControls: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 12
  },
  bottomControls: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "center"
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  rateText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  controlText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12
  }
});

interface ImageViewerProps {
  visible: boolean;
  currentMessage: IMessage | null;
  allMediaMessages: IMessage[];
  onClose: () => void;
  onMediaChange: (message: IMessage) => void;
}

function ImageViewerComponent({
  visible,
  currentMessage,
  allMediaMessages,
  onClose,
  onMediaChange
}: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Mevcut mesajın index'i
  const currentIndex = useMemo(() => {
    if (!currentMessage) return 0;
    return allMediaMessages.findIndex((m) => m._id === currentMessage._id);
  }, [currentMessage, allMediaMessages]);

  // Gönderen bilgisi - her zaman gerçek adı göster
  const senderName = useMemo(() => {
    if (!currentMessage) return "";
    const name = currentMessage.user.name || "Kullanıcı";
    console.log("[ImageViewer] Sender name:", {
      _id: currentMessage.user._id,
      name: currentMessage.user.name,
      finalName: name
    });
    return name;
  }, [currentMessage]);

  // Tarih formatı
  const dateText = useMemo(() => {
    if (!currentMessage?.createdAt) return "";
    return dayjs(currentMessage.createdAt).format("DD.MM.YYYY HH:mm");
  }, [currentMessage]);

  // Swipe ile medya değiştirme
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < allMediaMessages.length) {
      const newMessage = allMediaMessages[index];
      if (newMessage._id !== currentMessage?._id) {
        onMediaChange(newMessage);
      }
    }
  };

  // Thumbnail'a tıklayınca o medyaya git
  const handleThumbnailPress = (message: IMessage, index: number) => {
    onMediaChange(message);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  // Log when viewer opens
  useEffect(() => {
    if (visible && currentMessage) {
      console.log("[ImageViewer] Opened with:", {
        messageId: currentMessage._id,
        hasImage: !!currentMessage.image,
        hasVideo: !!currentMessage.video,
        video: currentMessage.video,
        image: currentMessage.image
      });
    }
  }, [visible, currentMessage]);

  if (!visible || !currentMessage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{senderName}</Text>
              <Text style={styles.headerSubtitle}>{dateText}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Main Image - Swipeable */}
        <FlatList
          ref={flatListRef}
          data={allMediaMessages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentIndex > 0 ? currentIndex : 0}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index
          })}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => (
            <Pressable style={styles.imageContainer} onPress={onClose}>
              {item.video ? (
                <VideoPlayer uri={item.video} isActive={item._id === currentMessage?._id} />
              ) : (
                <Image source={{ uri: item.image }} style={styles.mainImage} contentFit="contain" />
              )}
            </Pressable>
          )}
        />

        {/* Thumbnail Gallery */}
        {allMediaMessages.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <FlatList
              data={allMediaMessages}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
              keyExtractor={(item) => `thumb-${item._id}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    item._id === currentMessage._id && styles.thumbnailActive
                  ]}
                  onPress={() => handleThumbnailPress(item, index)}
                >
                  {item.video ? (
                    <VideoThumbnail uri={item.video} width={56} height={56} compact />
                  ) : (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.thumbnailImage}
                      contentFit="cover"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Footer Toolbar */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-undo-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="star-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom safe area */}
        <View style={{ height: insets.bottom, backgroundColor: "rgba(0,0,0,0.5)" }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  // Header
  headerWrapper: {
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  headerInfo: {
    flex: 1,
    alignItems: "center"
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2
  },
  // Main Image
  imageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6
  },
  // Thumbnail Gallery
  thumbnailContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 8
  },
  thumbnailList: {
    paddingHorizontal: 8
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent"
  },
  thumbnailActive: {
    borderColor: "#fff"
  },
  thumbnailImage: {
    width: "100%",
    height: "100%"
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  actionButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center"
  }
});

export const ImageViewer = memo(ImageViewerComponent);
