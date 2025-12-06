import type { LiveSession, LiveParticipant } from "@/lib/types/live";

export interface LiveMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    id: string;
    user_id?: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export type MessageActionType = "kick" | "ban" | "delete" | null;

export interface SessionWithDetails extends LiveSession {
  current_viewers: number;
  total_joins: number;
  message_count: number;
  gift_count: number;
  duration_seconds: number;
}

export type { LiveParticipant };
