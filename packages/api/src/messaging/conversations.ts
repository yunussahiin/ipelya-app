/**
 * Conversations API Client
 *
 * Amaç: DM sohbet işlemleri için API fonksiyonları
 * Tarih: 2025-11-26
 */

import { supabase } from "@ipelya/config";
import type {
  Conversation,
  ConversationListItem,
  ConversationParticipant,
  CreateConversationRequest,
} from "@ipelya/types";

// =============================================
// CONVERSATION QUERIES
// =============================================

/**
 * Kullanıcının tüm sohbetlerini getirir
 * Son mesaja göre sıralı, pagination destekli
 */
export async function getConversations(params?: {
  limit?: number;
  cursor?: string;
  archived?: boolean;
}): Promise<{ data: ConversationListItem[]; nextCursor: string | null }> {
  const { limit = 20, cursor, archived = false } = params || {};

  let query = supabase
    .from("conversations")
    .select(
      `
      id,
      type,
      name,
      avatar_url,
      last_message_at,
      is_archived,
      conversation_participants!inner (
        user_id,
        unread_count,
        is_muted,
        profile:profiles (
          id,
          display_name,
          avatar_url,
          username
        )
      ),
      last_message:messages (
        content,
        content_type,
        sender_id,
        sender_profile:profiles (
          display_name
        )
      )
    `
    )
    .eq("is_archived", archived)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("last_message_at", cursor);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Veriyi ConversationListItem formatına dönüştür
  const conversations: ConversationListItem[] = (data || []).map((conv) => {
    const myParticipant = conv.conversation_participants?.find(
      (p: ConversationParticipant) => p.user_id === supabase.auth.getUser()
    );
    const otherParticipant = conv.conversation_participants?.find(
      (p: ConversationParticipant) => p.user_id !== supabase.auth.getUser()
    );

    return {
      id: conv.id,
      type: conv.type,
      name: conv.name,
      avatar_url: conv.avatar_url,
      last_message_at: conv.last_message_at,
      unread_count: myParticipant?.unread_count || 0,
      is_muted: myParticipant?.is_muted || false,
      other_participant: otherParticipant?.profile
        ? {
            user_id: otherParticipant.user_id,
            display_name: otherParticipant.profile.display_name,
            avatar_url: otherParticipant.profile.avatar_url,
            username: otherParticipant.profile.username,
          }
        : undefined,
      last_message_preview: conv.last_message?.[0]
        ? {
            content: conv.last_message[0].content,
            content_type: conv.last_message[0].content_type,
            sender_name: conv.last_message[0].sender_profile?.display_name,
            is_mine:
              conv.last_message[0].sender_id === supabase.auth.getUser(),
          }
        : undefined,
    };
  });

  const nextCursor =
    conversations.length === limit
      ? conversations[conversations.length - 1]?.last_message_at
      : null;

  return { data: conversations, nextCursor };
}

/**
 * Tek bir sohbeti getirir
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      conversation_participants (
        *,
        profile:profiles (
          id,
          display_name,
          avatar_url,
          username
        )
      )
    `
    )
    .eq("id", conversationId)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Direct sohbetlerde karşı tarafın bilgisini ekle
  if (data.type === "direct" && data.conversation_participants && user) {
    const otherParticipant = data.conversation_participants.find(
      (p: any) => p.user_id !== user.id
    );
    if (otherParticipant?.profile) {
      (data as any).other_participant = {
        user_id: otherParticipant.user_id,
        display_name: otherParticipant.profile.display_name,
        avatar_url: otherParticipant.profile.avatar_url,
        username: otherParticipant.profile.username,
      };
    }
  }

  return data;
}

/**
 * İki kullanıcı arasındaki mevcut direct sohbeti bulur
 */
export async function findDirectConversation(
  otherUserId: string
): Promise<Conversation | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Önce kullanıcının katıldığı direct sohbetleri bul
  const { data: myConversations, error: myError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)
    .is("left_at", null);

  if (myError) throw myError;

  if (!myConversations?.length) return null;

  const conversationIds = myConversations.map((c) => c.conversation_id);

  // Bu sohbetlerden diğer kullanıcının da katıldığı direct olanı bul
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      conversation_participants!inner (
        user_id
      )
    `
    )
    .eq("type", "direct")
    .in("id", conversationIds)
    .eq("conversation_participants.user_id", otherUserId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

// =============================================
// CONVERSATION MUTATIONS
// =============================================

/**
 * Yeni sohbet oluşturur
 * Direct sohbet için mevcut varsa onu döndürür
 */
export async function createConversation(
  request: CreateConversationRequest
): Promise<Conversation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Direct sohbet için mevcut kontrolü
  if (request.type === "direct" && request.participant_ids.length === 1) {
    const existing = await findDirectConversation(request.participant_ids[0]);
    if (existing) return existing;
  }

  // Yeni sohbet oluştur
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      type: request.type,
      name: request.name,
      avatar_url: request.avatar_url,
      created_by: user.id,
    })
    .select()
    .single();

  if (convError) throw convError;

  // Katılımcıları ekle (kendisi dahil)
  const allParticipants = [...new Set([user.id, ...request.participant_ids])];
  const participantRows = allParticipants.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
    role: userId === user.id ? "admin" : "member",
  }));

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participantRows);

  if (partError) throw partError;

  return conversation;
}

/**
 * Sohbeti arşivler
 */
export async function archiveConversation(
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ is_archived: true })
    .eq("id", conversationId);

  if (error) throw error;
}

/**
 * Sohbeti arşivden çıkarır
 */
export async function unarchiveConversation(
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ is_archived: false })
    .eq("id", conversationId);

  if (error) throw error;
}

/**
 * Sohbetten ayrılır (grup için)
 */
export async function leaveConversation(
  conversationId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("conversation_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

/**
 * Sohbet bildirimlerini sessize alır
 */
export async function muteConversation(
  conversationId: string,
  until?: Date
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("conversation_participants")
    .update({
      is_muted: true,
      muted_until: until?.toISOString() || null,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

/**
 * Sohbet bildirimlerini açar
 */
export async function unmuteConversation(
  conversationId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("conversation_participants")
    .update({
      is_muted: false,
      muted_until: null,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

/**
 * Toplam okunmamış mesaj sayısını getirir
 */
export async function getTotalUnreadCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("unread_count")
    .eq("user_id", user.id)
    .is("left_at", null);

  if (error) throw error;

  return (data || []).reduce((sum, p) => sum + (p.unread_count || 0), 0);
}
