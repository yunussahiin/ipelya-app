/**
 * LiveKit Server API Client
 * RoomService, EgressService kullanımı için yardımcı fonksiyonlar
 * 
 * @see https://docs.livekit.io/reference/server/server-apis
 */

import { RoomServiceClient, Room, ParticipantInfo, TrackInfo } from "livekit-server-sdk";

// Singleton instance
let roomServiceInstance: RoomServiceClient | null = null;

/**
 * RoomService client'ı döndürür (singleton)
 */
export function getRoomService(): RoomServiceClient {
  if (!roomServiceInstance) {
    const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace("wss://", "https://");
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitHost || !apiKey || !apiSecret) {
      throw new Error("LiveKit environment variables not configured");
    }

    roomServiceInstance = new RoomServiceClient(livekitHost, apiKey, apiSecret);
  }
  return roomServiceInstance;
}

// ============================================
// Room Management
// ============================================

/**
 * Aktif odaları listeler
 */
export async function listRooms(names?: string[]): Promise<Room[]> {
  const roomService = getRoomService();
  return roomService.listRooms(names);
}

/**
 * Odayı siler - TÜM KATILIMCILAR ATILIR
 */
export async function deleteRoom(roomName: string): Promise<void> {
  const roomService = getRoomService();
  await roomService.deleteRoom(roomName);
}

/**
 * Oda metadata'sını günceller
 */
export async function updateRoomMetadata(roomName: string, metadata: string): Promise<void> {
  const roomService = getRoomService();
  await roomService.updateRoomMetadata(roomName, metadata);
}

// ============================================
// Participant Management
// ============================================

/**
 * Odadaki katılımcıları listeler
 */
export async function listParticipants(roomName: string): Promise<ParticipantInfo[]> {
  const roomService = getRoomService();
  return roomService.listParticipants(roomName);
}

/**
 * Tek bir katılımcının bilgisini alır
 */
export async function getParticipant(roomName: string, identity: string): Promise<ParticipantInfo> {
  const roomService = getRoomService();
  return roomService.getParticipant(roomName, identity);
}

/**
 * Katılımcıyı odadan çıkarır (KICK)
 * DisconnectReason.PARTICIPANT_REMOVED olarak client'a iletilir
 */
export async function removeParticipant(roomName: string, identity: string): Promise<void> {
  const roomService = getRoomService();
  await roomService.removeParticipant(roomName, identity);
}

/**
 * Katılımcının track'ini mute/unmute yapar
 */
export async function muteParticipantTrack(
  roomName: string,
  identity: string,
  trackSid: string,
  muted: boolean
): Promise<TrackInfo> {
  const roomService = getRoomService();
  return roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
}

/**
 * Katılımcının metadata veya permission'larını günceller
 */
export async function updateParticipant(
  roomName: string,
  identity: string,
  options: {
    metadata?: string;
    permissions?: {
      canSubscribe?: boolean;
      canPublish?: boolean;
      canPublishData?: boolean;
      hidden?: boolean;
    };
  }
): Promise<ParticipantInfo> {
  const roomService = getRoomService();
  return roomService.updateParticipant(roomName, identity, options.metadata, options.permissions);
}

// ============================================
// Data Packets
// ============================================

/**
 * Odaya data paketi gönderir (duyuru vb.)
 */
export async function sendData(
  roomName: string,
  data: Uint8Array | string,
  options: {
    kind?: "reliable" | "lossy";
    destinationIdentities?: string[];
    topic?: string;
  } = {}
): Promise<void> {
  const roomService = getRoomService();
  
  const payload = typeof data === "string" 
    ? new TextEncoder().encode(data) 
    : data;
  
  await roomService.sendData(
    roomName,
    payload,
    options.kind === "lossy" ? 1 : 0, // 0 = reliable, 1 = lossy
    {
      destinationIdentities: options.destinationIdentities,
      topic: options.topic,
    }
  );
}

/**
 * Admin duyurusu gönderir (JSON formatında)
 */
export async function sendAdminAnnouncement(
  roomName: string,
  message: string,
  type: "info" | "warning" | "alert" = "info"
): Promise<void> {
  const payload = JSON.stringify({
    type: "admin_announcement",
    message,
    alertType: type,
    timestamp: new Date().toISOString(),
  });
  
  await sendData(roomName, payload, {
    kind: "reliable",
    topic: "admin",
  });
}

// ============================================
// Composite Actions
// ============================================

/**
 * Katılımcıyı kick eder (LiveKit + logging)
 */
export async function kickParticipant(
  roomName: string,
  identity: string,
  _reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // LiveKit'ten gerçekten çıkar
    await removeParticipant(roomName, identity);
    
    // Başarılı
    return { success: true };
  } catch (error) {
    console.error("LiveKit kick error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Odayı sonlandırır (tüm katılımcılar atılır)
 */
export async function terminateRoom(
  roomName: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Önce duyuru gönder (opsiyonel)
    if (reason) {
      try {
        await sendAdminAnnouncement(roomName, reason, "alert");
        // Kısa bekleme - client'ların mesajı alması için
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch {
        // Duyuru gönderilemese de devam et
      }
    }
    
    // Odayı sil
    await deleteRoom(roomName);
    
    return { success: true };
  } catch (error) {
    console.error("LiveKit terminate error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Katılımcının tüm track'lerini mute eder
 */
export async function muteAllTracks(
  roomName: string,
  identity: string,
  muted: boolean = true
): Promise<{ success: boolean; mutedTracks: number }> {
  try {
    const participant = await getParticipant(roomName, identity);
    let mutedCount = 0;
    
    for (const track of participant.tracks || []) {
      if (track.sid) {
        await muteParticipantTrack(roomName, identity, track.sid, muted);
        mutedCount++;
      }
    }
    
    return { success: true, mutedTracks: mutedCount };
  } catch (error) {
    console.error("LiveKit mute error:", error);
    return { success: false, mutedTracks: 0 };
  }
}
