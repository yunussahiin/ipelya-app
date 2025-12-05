/**
 * Live Video View
 * LiveKit video track'lerini render eden wrapper component
 * Host ve co-host videoları için kullanılır
 */

import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import { VideoTrack, isTrackReference, TrackReferenceOrPlaceholder } from "@livekit/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface LiveVideoViewProps {
  trackRef: TrackReferenceOrPlaceholder | null;
  participantName?: string;
  participantAvatar?: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  showOverlay?: boolean;
  style?: object;
}

export function LiveVideoView({
  trackRef,
  participantName,
  participantAvatar,
  isHost = false,
  isMuted = false,
  isVideoOff = false,
  showOverlay = true,
  style
}: LiveVideoViewProps) {
  const { colors } = useTheme();

  // Track reference kontrolü
  const hasVideoTrack = trackRef && isTrackReference(trackRef);

  // Placeholder view (video kapalı veya track yok)
  const renderPlaceholder = () => (
    <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt }]}>
      {participantAvatar ? (
        <Image source={{ uri: participantAvatar }} style={styles.avatarLarge} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={48} color="#fff" />
        </View>
      )}
      {isVideoOff && (
        <View style={[styles.videoOffBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <Ionicons name="videocam-off" size={16} color="#fff" />
          <Text style={styles.videoOffText}>Kamera Kapalı</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Video veya Placeholder */}
      {hasVideoTrack && !isVideoOff ? (
        <VideoTrack trackRef={trackRef} style={styles.video} objectFit="cover" />
      ) : (
        renderPlaceholder()
      )}

      {/* Overlay bilgileri */}
      {showOverlay && (
        <View style={styles.overlay}>
          {/* Sol alt - katılımcı bilgisi */}
          <View style={styles.participantInfo}>
            {isHost && (
              <View style={[styles.hostBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.hostBadgeText}>HOST</Text>
              </View>
            )}
            {participantName && (
              <View style={[styles.nameBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {participantName}
                </Text>
              </View>
            )}
          </View>

          {/* Sağ alt - durum ikonları */}
          <View style={styles.statusIcons}>
            {isMuted && (
              <View style={[styles.statusIcon, { backgroundColor: "#EF4444" }]}>
                <Ionicons name="mic-off" size={14} color="#fff" />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000"
  },
  video: {
    flex: 1
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center"
  },
  videoOffBadge: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  videoOffText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 12
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  hostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  hostBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  },
  nameBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 150
  },
  nameText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500"
  },
  statusIcons: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 6
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default LiveVideoView;
