// Admin Chat Types

export interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  role?: string;
}

export interface OpsConversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  created_at: string;
  created_by: string | null;
  participants: ConversationParticipant[];
  unread_count: number;
  last_message?: string | null;
}

export interface ConversationParticipant {
  admin_id: string;
  admin: AdminProfile | null;
  role?: string;
  can_write?: boolean;
  joined_at?: string;
}

export interface OpsMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: MessageContentType;
  media_url?: string | null;
  media_metadata?: MediaMetadata | null;
  created_at: string;
  sender: AdminProfile | null;
  reply_to_id?: string | null;
  reply_to?: ReplyTo | null;
  read_by?: string[];
  is_edited?: boolean;
  is_deleted?: boolean;
}

export type MessageContentType = "text" | "image" | "video" | "audio" | "file";

export interface MediaMetadata {
  size: number;
  mime_type: string;
  filename?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

export interface ReplyTo {
  id: string;
  content: string;
  sender_name: string;
}

export interface TypingStatus {
  conversation_id: string;
  admin_id: string;
  admin_name?: string;
  is_typing: boolean;
  updated_at: string;
}

export interface MessageLoadResult {
  messages: OpsMessage[];
  hasMore: boolean;
  oldestMessageId?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  metadata?: MediaMetadata;
  error?: string;
}
