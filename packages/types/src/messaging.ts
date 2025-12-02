// =============================================
// İPELYA MESAJ SİSTEMİ - TYPE DEFINITIONS
// Tarih: 2025-11-26
// Açıklama: DM ve Broadcast Channel tipleri
// =============================================

// =============================================
// CONVERSATION TYPES (DM)
// =============================================

/**
 * Sohbet türü: direct (1:1) veya group
 */
export type ConversationType = "direct" | "group";

/**
 * Katılımcı rolü
 */
export type ConversationParticipantRole = "admin" | "member";

/**
 * Sohbet (Conversation)
 */
export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  last_message_id: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // İlişkiler (join ile gelir)
  participants?: ConversationParticipant[];
  last_message?: Message;
}

/**
 * Sohbet katılımcısı
 */
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  profile_id: string | null;
  role: ConversationParticipantRole;
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  muted_until: string | null;
  last_read_at: string | null;
  last_read_message_id: string | null;
  unread_count: number;
  // İlişkiler
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

/**
 * Sohbet teması
 */
export type ChatThemeId =
  | "ipelya"
  | "love"
  | "night"
  | "nature"
  | "ocean"
  | "sunset"
  | "neon"
  | "vintage";

/**
 * Sohbet listesi öğesi (UI için optimize edilmiş)
 */
export interface ConversationListItem {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_muted: boolean;
  is_pinned?: boolean;
  // Tema bilgisi
  theme?: ChatThemeId;
  theme_changed_by?: string;
  theme_changed_at?: string;
  // Diğer katılımcı bilgisi (direct için)
  other_participant?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    is_online?: boolean;
  };
  // Son mesaj önizleme
  last_message_preview?: {
    content: string | null;
    content_type: MessageContentType;
    sender_name: string | null;
    is_mine: boolean;
  };
}

/**
 * Yeni sohbet oluşturma isteği
 */
export interface CreateConversationRequest {
  type: ConversationType;
  participant_ids: string[];
  name?: string;
  avatar_url?: string;
}

// =============================================
// MESSAGE TYPES
// =============================================

/**
 * Mesaj içerik türü
 */
export type MessageContentType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "gif"
  | "sticker"
  | "location";

/**
 * Mesaj durumu
 */
export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

/**
 * Media metadata
 */
export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // Video/audio için saniye
  size?: number; // Byte
  mime_type?: string;
  thumbnail_url?: string;
}

/**
 * Mesaj
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_profile_id: string | null;
  content: string | null;
  content_type: MessageContentType;
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_metadata: MediaMetadata | null;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  status: MessageStatus;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_for: string[];
  is_flagged: boolean;
  moderation_status: string;
  // Shadow mode
  is_shadow: boolean;
  shadow_retention_days: number;
  is_deleted_for_user: boolean;
  user_deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // İlişkiler
  reply_to?: Message;
  sender_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  reactions?: MessageReaction[];
}

/**
 * Mesaj tepkisi
 */
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/**
 * Mesaj okundu bilgisi
 */
export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

/**
 * Yeni mesaj gönderme isteği
 */
export interface CreateMessageRequest {
  conversation_id: string;
  content?: string;
  content_type: MessageContentType;
  media_url?: string;
  media_thumbnail_url?: string;
  media_metadata?: MediaMetadata;
  reply_to_id?: string;
  is_shadow?: boolean;
}

/**
 * Mesaj güncelleme isteği
 */
export interface UpdateMessageRequest {
  message_id: string;
  content: string;
}

/**
 * Mesaj silme isteği
 */
export interface DeleteMessageRequest {
  message_id: string;
  delete_for: "me" | "everyone";
}

// =============================================
// BROADCAST CHANNEL TYPES
// =============================================

/**
 * Kanal erişim türü
 */
export type BroadcastAccessType =
  | "public"
  | "subscribers_only"
  | "tier_specific";

/**
 * Kanal üye rolü
 */
export type BroadcastMemberRole =
  | "owner"
  | "moderator"
  | "subscriber"
  | "follower";

/**
 * Broadcast mesaj içerik türü
 */
export type BroadcastMessageContentType =
  | "text"
  | "image"
  | "video"
  | "poll"
  | "announcement";

/**
 * Yayın kanalı
 */
export interface BroadcastChannel {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  access_type: BroadcastAccessType;
  required_tier_id: string | null;
  member_count: number;
  message_count: number;
  allowed_reactions: string[];
  polls_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // İlişkiler
  creator?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    is_verified?: boolean;
  };
  my_membership?: BroadcastChannelMember;
}

/**
 * Kanal üyesi
 */
export interface BroadcastChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: BroadcastMemberRole;
  notifications_enabled: boolean;
  is_muted: boolean;
  muted_until: string | null;
  joined_at: string;
  left_at: string | null;
}

/**
 * Yayın mesajı
 */
export interface BroadcastMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string | null;
  content_type: BroadcastMessageContentType;
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_metadata: MediaMetadata | null;
  poll_id: string | null;
  view_count: number;
  reaction_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // İlişkiler
  poll?: BroadcastPoll;
  reactions?: BroadcastReactionSummary[];
  my_reaction?: string | null;
}

/**
 * Anket seçeneği
 */
export interface BroadcastPollOption {
  id: string;
  text: string;
  vote_count: number;
}

/**
 * Anket
 */
export interface BroadcastPoll {
  id: string;
  channel_id: string;
  message_id: string | null;
  question: string;
  options: BroadcastPollOption[];
  is_multiple_choice: boolean;
  expires_at: string | null;
  is_closed: boolean;
  total_votes: number;
  created_at: string;
  // Kullanıcının oyu
  my_votes?: string[];
}

/**
 * Anket oyu
 */
export interface BroadcastPollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_ids: string[];
  created_at: string;
}

/**
 * Tepki özeti (UI için)
 */
export interface BroadcastReactionSummary {
  emoji: string;
  count: number;
}

/**
 * Yayın tepkisi
 */
export interface BroadcastReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/**
 * Yeni kanal oluşturma isteği
 */
export interface CreateBroadcastChannelRequest {
  name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  access_type: BroadcastAccessType;
  required_tier_id?: string;
  allowed_reactions?: string[];
  polls_enabled?: boolean;
}

/**
 * Yayın mesajı gönderme isteği
 */
export interface SendBroadcastMessageRequest {
  channel_id: string;
  content?: string;
  content_type: BroadcastMessageContentType;
  media_url?: string;
  media_thumbnail_url?: string;
  media_metadata?: MediaMetadata;
  poll?: {
    question: string;
    options: string[];
    is_multiple_choice?: boolean;
    expires_in_hours?: number;
  };
}

// =============================================
// PRESENCE TYPES
// =============================================

/**
 * Kullanıcı durumu
 */
export type PresenceStatus = "online" | "away" | "busy" | "offline";

/**
 * Kullanıcı presence bilgisi
 */
export interface UserPresence {
  user_id: string;
  profile_id?: string;
  status: PresenceStatus;
  online_at: string;
  last_seen_at: string;
  device: "mobile" | "web";
}

/**
 * Typing event
 */
export interface TypingEvent {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  timestamp: number;
}

// =============================================
// REALTIME EVENT TYPES
// =============================================

/**
 * Mesaj realtime event türleri
 */
export type MessageRealtimeEventType =
  | "message:new"
  | "message:update"
  | "message:delete"
  | "message:reaction";

/**
 * Broadcast realtime event türleri
 */
export type BroadcastRealtimeEventType =
  | "broadcast:message:new"
  | "broadcast:message:update"
  | "broadcast:reaction"
  | "broadcast:poll:vote";

/**
 * Presence realtime event türleri
 */
export type PresenceRealtimeEventType =
  | "presence:sync"
  | "presence:join"
  | "presence:leave"
  | "typing:start"
  | "typing:stop";

// =============================================
// LEGACY EXPORT (Geriye uyumluluk)
// =============================================

/**
 * @deprecated Use Message instead
 */
export type DirectMessage = {
  id: string;
  senderId: string;
  body: string;
};
