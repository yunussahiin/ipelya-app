/**
 * VoiceMomentCard Component
 *
 * Amaç: Ses paylaşımı kartı - Voice recording display
 *
 * Özellikler:
 * - Waveform visualization
 * - Play/pause button
 * - Progress bar
 * - Like & reply buttons
 *
 * Props:
 * - voiceMoment: VoiceMoment objesi
 * - onPlay: Play callback
 * - onLike: Like callback
 *
 * Not: expo-av gerekli (audio playback için)
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Play, Pause, Heart, MessageCircle } from "lucide-react-native";

interface VoiceMomentCardProps {
  voiceMoment: {
    id: string;
    user?: any;
    audio_url: string;
    duration: number;
    caption?: string;
    likes_count: number;
    replies_count: number;
    is_liked?: boolean;
  };
  onPlay?: () => void;
  onLike?: () => void;
  onReply?: () => void;
}

export function VoiceMomentCard({ voiceMoment, onPlay, onLike, onReply }: VoiceMomentCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play/pause handler
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (onPlay) onPlay();
  };

  return (
    <View style={styles.card}>
      {/* Play button */}
      <Pressable onPress={handlePlayPause} style={styles.playButton}>
        {isPlaying ? <Pause size={32} color="#FFFFFF" /> : <Play size={32} color="#FFFFFF" />}
      </Pressable>

      {/* Waveform (placeholder) */}
      <View style={styles.waveform}>
        <Text style={styles.duration}>{voiceMoment.duration}s</Text>
      </View>

      {/* Caption */}
      {voiceMoment.caption && <Text style={styles.caption}>{voiceMoment.caption}</Text>}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actionButton}>
          <Heart
            size={20}
            color={voiceMoment.is_liked ? "#FF6B9D" : "#6C757D"}
            fill={voiceMoment.is_liked ? "#FF6B9D" : "none"}
          />
          <Text style={styles.actionText}>{voiceMoment.likes_count}</Text>
        </Pressable>

        <Pressable onPress={onReply} style={styles.actionButton}>
          <MessageCircle size={20} color="#6C757D" />
          <Text style={styles.actionText}>{voiceMoment.replies_count}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B9D",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  waveform: {
    height: 60,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  duration: {
    fontSize: 14,
    color: "#6C757D"
  },
  caption: {
    fontSize: 14,
    color: "#212529",
    marginBottom: 12
  },
  actions: {
    flexDirection: "row",
    gap: 16
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  actionText: {
    fontSize: 14,
    color: "#6C757D"
  }
});
