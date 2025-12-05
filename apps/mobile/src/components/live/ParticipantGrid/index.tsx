/**
 * Participant Grid
 * Multi-participant video layout
 * Host + Co-Host'ları dinamik grid'de gösterir
 * GUEST_COHOST.md - Layout Modes referansı
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { TrackReferenceOrPlaceholder } from "@livekit/react-native";
import { LiveVideoView } from "../LiveVideoView";

interface Participant {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  trackRef: TrackReferenceOrPlaceholder | null;
}

interface ParticipantGridProps {
  participants: Participant[];
  maxParticipants?: number;
}

type LayoutMode = "single" | "split" | "grid-3" | "grid-4";

export function ParticipantGrid({ participants, maxParticipants = 4 }: ParticipantGridProps) {
  // Layout hesapla
  const { layout, sortedParticipants } = useMemo(() => {
    // Host'u en başa al
    const sorted = [...participants]
      .sort((a, b) => {
        if (a.isHost && !b.isHost) return -1;
        if (!a.isHost && b.isHost) return 1;
        return 0;
      })
      .slice(0, maxParticipants);

    let layoutMode: LayoutMode;
    switch (sorted.length) {
      case 1:
        layoutMode = "single";
        break;
      case 2:
        layoutMode = "split";
        break;
      case 3:
        layoutMode = "grid-3";
        break;
      default:
        layoutMode = "grid-4";
        break;
    }

    return { layout: layoutMode, sortedParticipants: sorted };
  }, [participants, maxParticipants]);

  // Single view - tek kişi
  if (layout === "single") {
    const participant = sortedParticipants[0];
    if (!participant) return null;

    return (
      <View style={styles.container}>
        <LiveVideoView
          trackRef={participant.trackRef}
          participantName={participant.name}
          participantAvatar={participant.avatar}
          isHost={participant.isHost}
          isMuted={participant.isMuted}
          isVideoOff={participant.isVideoOff}
          style={styles.fullView}
        />
      </View>
    );
  }

  // Split view - 2 kişi (üst-alt)
  if (layout === "split") {
    return (
      <View style={styles.container}>
        {sortedParticipants.map((participant) => (
          <LiveVideoView
            key={participant.id}
            trackRef={participant.trackRef}
            participantName={participant.name}
            participantAvatar={participant.avatar}
            isHost={participant.isHost}
            isMuted={participant.isMuted}
            isVideoOff={participant.isVideoOff}
            style={styles.halfView}
          />
        ))}
      </View>
    );
  }

  // Grid-3 - Host büyük, 2 co-host küçük
  if (layout === "grid-3") {
    const [host, ...coHosts] = sortedParticipants;

    return (
      <View style={styles.container}>
        {/* Host - 2/3 alan */}
        <LiveVideoView
          trackRef={host.trackRef}
          participantName={host.name}
          participantAvatar={host.avatar}
          isHost={host.isHost}
          isMuted={host.isMuted}
          isVideoOff={host.isVideoOff}
          style={styles.mainView}
        />

        {/* Co-hosts - 1/3 alan, yan yana */}
        <View style={styles.coHostRow}>
          {coHosts.map((coHost) => (
            <LiveVideoView
              key={coHost.id}
              trackRef={coHost.trackRef}
              participantName={coHost.name}
              participantAvatar={coHost.avatar}
              isHost={coHost.isHost}
              isMuted={coHost.isMuted}
              isVideoOff={coHost.isVideoOff}
              style={styles.smallView}
            />
          ))}
        </View>
      </View>
    );
  }

  // Grid-4 - 2x2 grid
  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        {sortedParticipants.slice(0, 2).map((participant) => (
          <LiveVideoView
            key={participant.id}
            trackRef={participant.trackRef}
            participantName={participant.name}
            participantAvatar={participant.avatar}
            isHost={participant.isHost}
            isMuted={participant.isMuted}
            isVideoOff={participant.isVideoOff}
            style={styles.quarterView}
          />
        ))}
      </View>
      <View style={styles.gridRow}>
        {sortedParticipants.slice(2, 4).map((participant) => (
          <LiveVideoView
            key={participant.id}
            trackRef={participant.trackRef}
            participantName={participant.name}
            participantAvatar={participant.avatar}
            isHost={participant.isHost}
            isMuted={participant.isMuted}
            isVideoOff={participant.isVideoOff}
            style={styles.quarterView}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 4
  },
  fullView: {
    flex: 1,
    borderRadius: 16
  },
  halfView: {
    flex: 1,
    borderRadius: 12
  },
  mainView: {
    flex: 2,
    borderRadius: 12
  },
  coHostRow: {
    flex: 1,
    flexDirection: "row",
    gap: 4
  },
  smallView: {
    flex: 1,
    borderRadius: 12
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
    gap: 4
  },
  quarterView: {
    flex: 1,
    borderRadius: 12
  }
});

export default ParticipantGrid;
