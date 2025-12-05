/**
 * Local PiP (Picture in Picture) Component
 */

import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LiveVideoView } from "@/components/live";
import { TrackPublication } from "livekit-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PIP_WIDTH = 120;
const PIP_HEIGHT = 160;

interface LocalPiPProps {
  videoTrack: TrackPublication | null;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  topInset: number;
  bottomInset: number;
}

export function LocalPiP({
  videoTrack,
  isMicrophoneEnabled,
  isCameraEnabled,
  topInset,
  bottomInset
}: LocalPiPProps) {
  const pipX = useSharedValue(SCREEN_WIDTH - PIP_WIDTH - 16);
  const pipY = useSharedValue(topInset + 60);

  const pipGesture = Gesture.Pan()
    .onUpdate((e) => {
      pipX.value = Math.max(
        16,
        Math.min(SCREEN_WIDTH - PIP_WIDTH - 16, e.absoluteX - PIP_WIDTH / 2)
      );
      pipY.value = Math.max(
        topInset + 16,
        Math.min(SCREEN_HEIGHT - PIP_HEIGHT - bottomInset - 100, e.absoluteY - PIP_HEIGHT / 2)
      );
    })
    .onEnd(() => {
      const snapToRight = pipX.value > SCREEN_WIDTH / 2;
      pipX.value = withSpring(snapToRight ? SCREEN_WIDTH - PIP_WIDTH - 16 : 16);
    });

  const pipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pipX.value }, { translateY: pipY.value }]
  }));

  return (
    <GestureDetector gesture={pipGesture}>
      <Animated.View style={[styles.pipContainer, pipStyle]}>
        <LiveVideoView
          trackRef={videoTrack}
          participantName="Siz"
          isMuted={!isMicrophoneEnabled}
          isVideoOff={!isCameraEnabled}
          showOverlay={false}
          mirror
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pipContainer: {
    position: "absolute",
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)"
  }
});

export default LocalPiP;
