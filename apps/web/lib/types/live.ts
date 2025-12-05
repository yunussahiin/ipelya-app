/**
 * LiveKit Live Session Types
 * Canlı yayın yönetim paneli için tip tanımları
 */

// =============================================
// Session Types
// =============================================

export type SessionType = 'video_live' | 'audio_room';
export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type AccessType = 'public' | 'subscribers_only' | 'pay_per_view';

export interface LiveSession {
  id: string;
  creator_id: string;
  creator_profile_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  session_type: SessionType;
  access_type: AccessType;
  ppv_coin_price: number;
  livekit_room_name: string;
  livekit_room_sid: string | null;
  status: SessionStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  peak_viewers: number;
  total_viewers: number;
  total_duration_seconds: number;
  total_gifts_received: number;
  total_messages: number;
  chat_enabled: boolean;
  gifts_enabled: boolean;
  recording_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  current_viewers?: number;
  duration_seconds?: number;
}

// =============================================
// Participant Types
// =============================================

export type ParticipantRole = 
  | 'host' 
  | 'co_host' 
  | 'invited_guest' 
  | 'moderator' 
  | 'speaker' 
  | 'viewer' 
  | 'listener';

export interface LiveParticipant {
  id: string;
  session_id: string;
  user_id: string;
  profile_id: string;
  role: ParticipantRole;
  is_active: boolean;
  is_muted: boolean;
  is_video_enabled: boolean;
  livekit_participant_sid: string | null;
  livekit_identity: string | null;
  joined_at: string;
  left_at: string | null;
  total_watch_time_seconds: number;
  paid_amount: number;
  created_at: string;
  // Joined fields
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// =============================================
// Call Types
// =============================================

export type CallType = 'video' | 'audio';
export type CallStatus = 
  | 'initiating' 
  | 'ringing' 
  | 'accepted' 
  | 'in_call' 
  | 'ended' 
  | 'missed' 
  | 'rejected' 
  | 'busy' 
  | 'failed';

export interface Call {
  id: string;
  caller_id: string;
  caller_profile_id: string;
  callee_id: string;
  callee_profile_id: string;
  call_type: CallType;
  status: CallStatus;
  livekit_room_name: string | null;
  livekit_room_sid: string | null;
  initiated_at: string | null;
  ringing_at: string | null;
  accepted_at: string | null;
  ended_at: string | null;
  end_reason: string | null;
  duration_seconds: number;
  created_at: string;
  // Joined fields
  caller?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  callee?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// =============================================
// Report Types
// =============================================

export type ReportReason = 
  | 'harassment' 
  | 'spam' 
  | 'nudity' 
  | 'violence' 
  | 'hate_speech' 
  | 'scam' 
  | 'underage' 
  | 'copyright' 
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'action_taken' | 'dismissed';

export type ReportAction = 
  | 'dismissed' 
  | 'warning' 
  | 'kick' 
  | 'ban_session' 
  | 'ban_creator' 
  | 'ban_global';

export interface LiveReport {
  id: string;
  session_id: string | null;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description: string | null;
  evidence_urls: string[] | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: ReportAction | null;
  action_note: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  reporter?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  reported_user?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  session?: {
    title: string | null;
  };
}

// =============================================
// Ban Types
// =============================================

export type BanType = 'session' | 'permanent';

export interface LiveSessionBan {
  id: string;
  session_id: string;
  banned_user_id: string;
  banned_by: string;
  reason: string | null;
  ban_type: BanType;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  lifted_at: string | null;
  lifted_by: string | null;
  // Joined fields
  banned_user?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  session?: {
    title: string | null;
  };
}

// =============================================
// Message Types
// =============================================

export type MessageType = 'text' | 'gift' | 'system' | 'pinned';

export interface LiveMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_profile_id: string;
  message_type: MessageType;
  content: string | null;
  gift_id: string | null;
  gift_quantity: number;
  gift_coin_value: number;
  is_deleted: boolean;
  is_pinned: boolean;
  created_at: string;
  // Joined fields
  sender?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  gift?: {
    name: string | null;
    icon_url: string | null;
  };
}

// =============================================
// Analytics Types
// =============================================

export interface LiveAnalyticsOverview {
  active_sessions: number;
  active_video_sessions: number;
  active_audio_rooms: number;
  active_calls: number;
  total_viewers: number;
  pending_reports: number;
  active_bans: number;
}

export interface DailyStats {
  date: string;
  session_count: number;
  total_hours: number;
  avg_duration_minutes: number;
  total_viewers: number;
  total_peak_viewers: number;
  total_messages: number;
  total_gifts: number;
}

export interface TopCreator {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  session_count: number;
  total_hours: number;
  avg_viewers: number;
  total_gifts: number;
}

// =============================================
// Admin Log Types
// =============================================

export type AdminAction = 
  | 'view_session'
  | 'terminate_session'
  | 'kick_participant'
  | 'ban_participant'
  | 'unban_user'
  | 'delete_message'
  | 'promote_user'
  | 'demote_user'
  | 'review_report'
  | 'dismiss_report'
  | 'send_announcement'
  | 'update_settings';

export interface LiveAdminLog {
  id: string;
  admin_id: string;
  action: AdminAction;
  target_type: 'session' | 'participant' | 'user' | 'message' | 'report' | 'ban' | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined fields
  admin?: {
    full_name: string | null;
    email: string | null;
  };
}

// =============================================
// API Response Types
// =============================================

export interface LiveSessionsResponse {
  sessions: LiveSession[];
  total: number;
}

export interface LiveTokenResponse {
  token: string;
  wsUrl: string;
}
