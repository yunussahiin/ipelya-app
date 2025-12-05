/**
 * Live Video View
 * LiveKit video track'lerini render eden wrapper component
 * Host ve co-host videoları için kullanılır
 */

import React from "react";
import { View, StyleSheet, Text, Image, ActivityIndicator } from "react-native";
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
  /** Video yüklenirken loading göster */
  isLoading?: boolean;
  /** Overlay bilgilerini göster (isim, badge vb.) - varsayılan false */
  showOverlay?: boolean;
  /** Sadece mute ikonu göster */
  showMuteIndicator?: boolean;
  mirror?: boolean;
  style?: object;
  bottomInset?: number;
}

export function LiveVideoView({
  trackRef,
  participantName,
  participantAvatar,
  isHost = false,
  isMuted = false,
  isVideoOff = false,
  isLoading = false,
  showOverlay = false,
  showMuteIndicator = true,
  style,
  bottomInset = 0
}: LiveVideoViewProps) {
  const { colors } = useTheme();

  // Track reference kontrolü
  const hasVideoTrack = trackRef && isTrackReference(trackRef);

  // Video henüz gelmedi ama kamera açık - loading durumu
  const showLoading = !hasVideoTrack && !isVideoOff && isLoading;

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
      {showLoading ? (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Yayın yükleniyor...</Text>
        </View>
      ) : isVideoOff ? (
        <View style={styles.videoOffBadge}>
          <Ionicons name="videocam-off" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.videoOffText}>Kamera kapalı</Text>
        </View>
      ) : null}
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

      {/* Overlay bilgileri - Opsiyonel */}
      {showOverlay && (
        <View style={[styles.overlay, { paddingBottom: 12 + bottomInset }]}>
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
        </View>
      )}

      {/* Mute indicator - Sağ alt köşe */}
      {showMuteIndicator && isMuted && (
        <View style={[styles.muteIndicator, { bottom: 12 + bottomInset }]}>
          <View style={[styles.statusIcon, { backgroundColor: "#EF4444" }]}>
            <Ionicons name="mic-off" size={14} color="#fff" />
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 6
  },
  videoOffText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "400"
  },
  loadingBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8
  },
  loadingText: {
    fontSize: 14,
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
  },
  muteIndicator: {
    position: "absolute",
    right: 12
  }
});

export default LiveVideoView;
