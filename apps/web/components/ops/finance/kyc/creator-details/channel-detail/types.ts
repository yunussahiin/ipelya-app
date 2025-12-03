export interface ReactionSummary {
  emoji: string;
  count: number;
}

export interface BroadcastMessage {
  id: string;
  content: string;
  contentType: "text" | "image" | "video" | "poll" | "file";
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  viewCount: number;
  reactionCount: number;
  reactions?: ReactionSummary[];
  isPinned: boolean;
  isCritical: boolean;
  createdAt: string;
}

export interface ChannelStats {
  totalMessages: number;
  totalViews: number;
  totalReactions: number;
  pinnedMessages: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
}
