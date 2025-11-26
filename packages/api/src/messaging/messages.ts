/**
 * Messages API Client
 *
 * Amaç: DM mesaj işlemleri için API fonksiyonları
 * Tarih: 2025-11-26
 */

import { supabase } from "@ipelya/config";
import type {
  Message,
  MessageReaction,
  CreateMessageRequest,
  UpdateMessageRequest,
  DeleteMessageRequest,
} from "@ipelya/types";

// =============================================
// MESSAGE QUERIES
// =============================================

/**
 * Sohbetteki mesajları getirir
 * Cursor-based pagination (en yeni mesajlar önce)
 */
export async function getMessages(params: {
  conversationId: string;
  limit?: number;
  cursor?: string;
}): Promise<{ data: Message[]; nextCursor: string | null }> {
  const { conversationId, limit = 50, cursor } = params;

  let query = supabase
    .from("messages")
    .select(
      `
      *,
      sender_profile:profiles!sender_profile_id (
        id,
        display_name,
        avatar_url,
        username
      ),
      reply_to:messages!reply_to_id (
        id,
        content,
        content_type,
        sender_profile:profiles!sender_profile_id (
          display_name
        )
      ),
      reactions:message_reactions (
        id,
        user_id,
        emoji,
        created_at
      )
    `
    )
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) throw error;

  const nextCursor =
    (data?.length || 0) === limit
      ? data?.[data.length - 1]?.created_at
      : null;

  return { data: data || [], nextCursor };
}

/**
 * Tek bir mesajı getirir
 */
export async function getMessage(messageId: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender_profile:profiles!sender_profile_id (
        id,
        display_name,
        avatar_url,
        username
      ),
      reply_to:messages!reply_to_id (
        id,
        content,
        content_type,
        sender_profile:profiles!sender_profile_id (
          display_name
        )
      ),
      reactions:message_reactions (
        id,
        user_id,
        emoji,
        created_at
      )
    `
    )
    .eq("id", messageId)
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// MESSAGE MUTATIONS
// =============================================

/**
 * Yeni mesaj gönderir
 */
export async function sendMessage(
  request: CreateMessageRequest
): Promise<Message> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Aktif profili al (real veya shadow)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, type")
    .eq("user_id", user.id)
    .eq("shadow_profile_active", request.is_shadow || false)
    .single();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: request.conversation_id,
      sender_id: user.id,
      sender_profile_id: profile?.id,
      content: request.content,
      content_type: request.content_type,
      media_url: request.media_url,
      media_thumbnail_url: request.media_thumbnail_url,
      media_metadata: request.media_metadata,
      reply_to_id: request.reply_to_id,
      is_shadow: request.is_shadow || false,
      status: "sent",
    })
    .select(
      `
      *,
      sender_profile:profiles!sender_profile_id (
        id,
        display_name,
        avatar_url,
        username
      )
    `
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mesajı düzenler
 */
export async function editMessage(
  request: UpdateMessageRequest
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .update({
      content: request.content,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", request.message_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mesajı siler
 */
export async function deleteMessage(
  request: DeleteMessageRequest
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  if (request.delete_for === "everyone") {
    // Herkes için sil
    const { error } = await supabase
      .from("messages")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", request.message_id);

    if (error) throw error;
  } else {
    // Sadece kendisi için sil (deleted_for array'ine ekle)
    const { data: message } = await supabase
      .from("messages")
      .select("deleted_for")
      .eq("id", request.message_id)
      .single();

    const deletedFor = [...(message?.deleted_for || []), user.id];

    const { error } = await supabase
      .from("messages")
      .update({ deleted_for: deletedFor })
      .eq("id", request.message_id);

    if (error) throw error;
  }
}

// =============================================
// READ RECEIPTS
// =============================================

/**
 * Mesajı okundu olarak işaretler
 */
export async function markAsRead(
  conversationId: string,
  messageId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Read receipt ekle
  await supabase.from("message_read_receipts").upsert(
    {
      message_id: messageId,
      user_id: user.id,
      read_at: new Date().toISOString(),
    },
    { onConflict: "message_id,user_id" }
  );

  // Participant'ın unread_count'unu sıfırla ve last_read güncelle
  const { error } = await supabase
    .from("conversation_participants")
    .update({
      unread_count: 0,
      last_read_at: new Date().toISOString(),
      last_read_message_id: messageId,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

/**
 * Mesajın okundu bilgilerini getirir
 */
export async function getReadReceipts(
  messageId: string
): Promise<{ user_id: string; read_at: string }[]> {
  const { data, error } = await supabase
    .from("message_read_receipts")
    .select("user_id, read_at")
    .eq("message_id", messageId);

  if (error) throw error;
  return data || [];
}

// =============================================
// REACTIONS
// =============================================

/**
 * Mesaja tepki ekler
 */
export async function addReaction(
  messageId: string,
  emoji: string
): Promise<MessageReaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { data, error } = await supabase
    .from("message_reactions")
    .insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mesajdan tepki kaldırır
 */
export async function removeReaction(
  messageId: string,
  emoji: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) throw error;
}

/**
 * Mesajın tepkilerini getirir
 */
export async function getReactions(
  messageId: string
): Promise<MessageReaction[]> {
  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .eq("message_id", messageId);

  if (error) throw error;
  return data || [];
}

// =============================================
// SEARCH
// =============================================

/**
 * Sohbette mesaj arar
 */
export async function searchMessages(params: {
  conversationId: string;
  query: string;
  limit?: number;
}): Promise<Message[]> {
  const { conversationId, query, limit = 20 } = params;

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender_profile:profiles!sender_profile_id (
        id,
        display_name,
        avatar_url,
        username
      )
    `
    )
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .ilike("content", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
