/**
 * Incoming Call Screen
 * Gelen arama ekranı - Tam ekran
 * Accept/Reject butonları, caller bilgisi, ringtone
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: "video" | "audio";
}

interface IncomingCallScreenProps {
  call: IncomingCallData;
  onAccept: () => void;
  onReject: () => void;
  onTimeout?: () => void;
  timeoutSeconds?: number;
}

export function IncomingCallScreen({
  call,
  onAccept,
  onReject,
  onTimeout,
  timeoutSeconds = 60
}: IncomingCallScreenProps) {
  const insets = useSafeAreaInsets();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for avatar
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [pulseAnim]);

  // Ring animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [ringAnim]);

  // Slide in animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true
    }).start();
  }, [slideAnim]);

  // Timeout
  useEffect(() => {
    if (!onTimeout) return;

    const timer = setTimeout(() => {
      onTimeout();
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [onTimeout, timeoutSeconds]);

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2]
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0]
  });

  const slideY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={StyleSheet.absoluteFill} />

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            transform: [{ translateY: slideY }]
          }
        ]}
      >
        {/* Call type indicator */}
        <View style={styles.callTypeContainer}>
          <Ionicons
            name={call.callType === "video" ? "videocam" : "call"}
            size={20}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.callTypeText}>
            {call.callType === "video" ? "Görüntülü Arama" : "Sesli Arama"}
          </Text>
        </View>

        {/* Caller info */}
        <View style={styles.callerInfo}>
          {/* Avatar with pulse animation */}
          <View style={styles.avatarContainer}>
            {/* Ring effect */}
            <Animated.View
              style={[
                styles.ringEffect,
                {
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity
                }
              ]}
            />

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              {call.callerAvatar ? (
                <Image source={{ uri: call.callerAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color="rgba(255,255,255,0.8)" />
                </View>
              )}
            </Animated.View>
          </View>

          {/* Name */}
          <Text style={styles.callerName}>{call.callerName}</Text>
          <Text style={styles.callingText}>arıyor...</Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Action buttons */}
        <View style={[styles.actions, { paddingBottom: insets.bottom + 40 }]}>
          {/* Reject button */}
          <Pressable style={styles.rejectButton} onPress={onReject}>
            <View style={styles.rejectButtonInner}>
              <Ionicons name="close" size={32} color="#fff" />
            </View>
            <Text style={styles.actionText}>Reddet</Text>
          </Pressable>

          {/* Accept button */}
          <Pressable style={styles.acceptButton} onPress={onAccept}>
            <Animated.View
              style={[styles.acceptButtonInner, { transform: [{ scale: pulseAnim }] }]}
            >
              <Ionicons
                name={call.callType === "video" ? "videocam" : "call"}
                size={32}
                color="#fff"
              />
            </Animated.View>
            <Text style={styles.actionText}>Kabul Et</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40
  },
  callTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 40
  },
  callTypeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500"
  },
  callerInfo: {
    alignItems: "center"
  },
  avatarContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24
  },
  ringEffect: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)"
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)"
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)"
  },
  callerName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8
  },
  callingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%"
  },
  rejectButton: {
    alignItems: "center",
    gap: 12
  },
  rejectButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  acceptButton: {
    alignItems: "center",
    gap: 12
  },
  acceptButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  actionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500"
  }
});

export default IncomingCallScreen;
