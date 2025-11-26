/**
 * Broadcast Channel API Client
 *
 * Amaç: Creator yayın kanalı işlemleri için API fonksiyonları
 * Tarih: 2025-11-26
 */

import { supabase } from "@ipelya/config";
import type {
  BroadcastChannel,
  BroadcastChannelMember,
  BroadcastMessage,
  BroadcastPoll,
  BroadcastReaction,
  CreateBroadcastChannelRequest,
  SendBroadcastMessageRequest,
} from "@ipelya/types";

// =============================================
// CHANNEL QUERIES
// =============================================

/**
 * Creator'ın kendi kanallarını getirir
 */
export async function getMyBroadcastChannels(): Promise<BroadcastChannel[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { data, error } = await supabase
    .from("broadcast_channels")
    .select("*")
    .eq("creator_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Kullanıcının üye olduğu kanalları getirir
 */
export async function getJoinedBroadcastChannels(): Promise<
  BroadcastChannel[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { data, error } = await supabase
    .from("broadcast_channel_members")
    .select(
      `
      channel:broadcast_channels (
        *,
        creator:profiles!creator_id (
          id,
          display_name,
          avatar_url,
          username,
          is_verified
        )
      )
    `
    )
    .eq("user_id", user.id)
    .is("left_at", null)
    .neq("role", "owner");

  if (error) throw error;

  // Channel'ları düzleştir
  return (data || [])
    .map((d) => d.channel)
    .filter((c): c is BroadcastChannel => c !== null);
}

/**
 * Tek bir kanalı getirir
 */
export async function getBroadcastChannel(
  channelId: string
): Promise<BroadcastChannel | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("broadcast_channels")
    .select(
      `
      *,
      creator:profiles!creator_id (
        id,
        display_name,
        avatar_url,
        username,
        is_verified
      )
    `
    )
    .eq("id", channelId)
    .single();

  if (error) throw error;

  // Kullanıcının üyelik bilgisini ekle
  if (user && data) {
    const { data: membership } = await supabase
      .from("broadcast_channel_members")
      .select("*")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .is("left_at", null)
      .single();

    return { ...data, my_membership: membership };
  }

  return data;
}

/**
 * Bir creator'ın public kanallarını getirir
 */
export async function getCreatorBroadcastChannels(
  creatorId: string
): Promise<BroadcastChannel[]> {
  const { data, error } = await supabase
    .from("broadcast_channels")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("is_active", true)
    .eq("access_type", "public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// =============================================
// CHANNEL MUTATIONS
// =============================================

/**
 * Yeni kanal oluşturur
 */
export async function createBroadcastChannel(
  request: CreateBroadcastChannelRequest
): Promise<BroadcastChannel> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Kanalı oluştur
  const { data: channel, error: channelError } = await supabase
    .from("broadcast_channels")
    .insert({
      creator_id: user.id,
      name: request.name,
      description: request.description,
      avatar_url: request.avatar_url,
      cover_url: request.cover_url,
      access_type: request.access_type,
      required_tier_id: request.required_tier_id,
      allowed_reactions: request.allowed_reactions || [
        "❤️",
        "🔥",
        "👏",
        "😍",
        "🎉",
      ],
      polls_enabled: request.polls_enabled ?? true,
    })
    .select()
    .single();

  if (channelError) throw channelError;

  // Creator'ı owner olarak ekle
  const { error: memberError } = await supabase
    .from("broadcast_channel_members")
    .insert({
      channel_id: channel.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) throw memberError;

  return channel;
}

/**
 * Kanal bilgilerini günceller
 */
export async function updateBroadcastChannel(
  channelId: string,
  updates: Partial<CreateBroadcastChannelRequest>
): Promise<BroadcastChannel> {
  const { data, error } = await supabase
    .from("broadcast_channels")
    .update(updates)
    .eq("id", channelId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Kanalı siler (soft delete)
 */
export async function deleteBroadcastChannel(channelId: string): Promise<void> {
  const { error } = await supabase
    .from("broadcast_channels")
    .update({ is_active: false })
    .eq("id", channelId);

  if (error) throw error;
}

// =============================================
// MEMBERSHIP
// =============================================

/**
 * Kanala katılır
 */
export async function joinBroadcastChannel(
  channelId: string
): Promise<BroadcastChannelMember> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Kanal bilgisini al
  const { data: channel } = await supabase
    .from("broadcast_channels")
    .select("access_type, creator_id")
    .eq("id", channelId)
    .single();

  if (!channel) throw new Error("Kanal bulunamadı");

  // Erişim kontrolü
  let role: "subscriber" | "follower" = "follower";

  if (channel.access_type === "subscribers_only") {
    // Abone kontrolü
    const { data: subscription } = await supabase
      .from("creator_subscriptions")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("creator_id", channel.creator_id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      throw new Error("Bu kanala katılmak için abone olmanız gerekiyor");
    }
    role = "subscriber";
  }

  // Mevcut üyelik kontrolü
  const { data: existing } = await supabase
    .from("broadcast_channel_members")
    .select("id, left_at")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Tekrar katıl
    const { data, error } = await supabase
      .from("broadcast_channel_members")
      .update({ left_at: null, role })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Yeni üyelik
  const { data, error } = await supabase
    .from("broadcast_channel_members")
    .insert({
      channel_id: channelId,
      user_id: user.id,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Kanaldan ayrılır
 */
export async function leaveBroadcastChannel(channelId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("broadcast_channel_members")
    .update({ left_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) throw error;
}

/**
 * Kanal bildirimlerini sessize alır
 */
export async function muteBroadcastChannel(
  channelId: string,
  until?: Date
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("broadcast_channel_members")
    .update({
      is_muted: true,
      muted_until: until?.toISOString() || null,
    })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) throw error;
}

// =============================================
// MESSAGES
// =============================================

/**
 * Kanal mesajlarını getirir
 */
export async function getBroadcastMessages(params: {
  channelId: string;
  limit?: number;
  cursor?: string;
}): Promise<{ data: BroadcastMessage[]; nextCursor: string | null }> {
  const { channelId, limit = 20, cursor } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("broadcast_messages")
    .select(
      `
      *,
      poll:broadcast_polls (
        *
      )
    `
    )
    .eq("channel_id", channelId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Kullanıcının tepkilerini ekle
  if (user && data?.length) {
    const messageIds = data.map((m) => m.id);
    const { data: myReactions } = await supabase
      .from("broadcast_reactions")
      .select("message_id, emoji")
      .eq("user_id", user.id)
      .in("message_id", messageIds);

    const reactionMap = new Map(
      (myReactions || []).map((r) => [r.message_id, r.emoji])
    );

    data.forEach((m) => {
      (m as BroadcastMessage).my_reaction = reactionMap.get(m.id) || null;
    });
  }

  const nextCursor =
    (data?.length || 0) === limit
      ? data?.[data.length - 1]?.created_at
      : null;

  return { data: data || [], nextCursor };
}

/**
 * Yayın mesajı gönderir (sadece owner)
 */
export async function sendBroadcastMessage(
  request: SendBroadcastMessageRequest
): Promise<BroadcastMessage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  let pollId: string | null = null;

  // Poll oluştur (varsa)
  if (request.poll && request.content_type === "poll") {
    const options = request.poll.options.map((text, index) => ({
      id: `opt_${index}`,
      text,
      vote_count: 0,
    }));

    const { data: poll, error: pollError } = await supabase
      .from("broadcast_polls")
      .insert({
        channel_id: request.channel_id,
        question: request.poll.question,
        options,
        is_multiple_choice: request.poll.is_multiple_choice || false,
        expires_at: request.poll.expires_in_hours
          ? new Date(
              Date.now() + request.poll.expires_in_hours * 60 * 60 * 1000
            ).toISOString()
          : null,
      })
      .select()
      .single();

    if (pollError) throw pollError;
    pollId = poll.id;
  }

  // Mesajı oluştur
  const { data, error } = await supabase
    .from("broadcast_messages")
    .insert({
      channel_id: request.channel_id,
      sender_id: user.id,
      content: request.content,
      content_type: request.content_type,
      media_url: request.media_url,
      media_thumbnail_url: request.media_thumbnail_url,
      media_metadata: request.media_metadata,
      poll_id: pollId,
    })
    .select(
      `
      *,
      poll:broadcast_polls (*)
    `
    )
    .single();

  if (error) throw error;

  // Poll'un message_id'sini güncelle
  if (pollId) {
    await supabase
      .from("broadcast_polls")
      .update({ message_id: data.id })
      .eq("id", pollId);
  }

  return data;
}

// =============================================
// REACTIONS
// =============================================

/**
 * Yayın mesajına tepki ekler
 */
export async function addBroadcastReaction(
  messageId: string,
  emoji: string
): Promise<BroadcastReaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { data, error } = await supabase
    .from("broadcast_reactions")
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
 * Yayın mesajından tepki kaldırır
 */
export async function removeBroadcastReaction(
  messageId: string,
  emoji: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("broadcast_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) throw error;
}

// =============================================
// POLLS
// =============================================

/**
 * Ankete oy verir
 */
export async function voteBroadcastPoll(
  pollId: string,
  optionIds: string[]
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Mevcut oy kontrolü
  const { data: existingVote } = await supabase
    .from("broadcast_poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  if (existingVote) {
    throw new Error("Bu ankete zaten oy verdiniz");
  }

  // Poll bilgisini al
  const { data: poll } = await supabase
    .from("broadcast_polls")
    .select("options, is_multiple_choice, is_closed, expires_at")
    .eq("id", pollId)
    .single();

  if (!poll) throw new Error("Anket bulunamadı");
  if (poll.is_closed) throw new Error("Anket kapatılmış");
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    throw new Error("Anket süresi dolmuş");
  }

  // Multiple choice kontrolü
  if (!poll.is_multiple_choice && optionIds.length > 1) {
    throw new Error("Bu ankette sadece bir seçenek seçebilirsiniz");
  }

  // Oyu kaydet
  const { error: voteError } = await supabase
    .from("broadcast_poll_votes")
    .insert({
      poll_id: pollId,
      user_id: user.id,
      option_ids: optionIds,
    });

  if (voteError) throw voteError;

  // Option vote_count'larını güncelle
  const options = poll.options as { id: string; text: string; vote_count: number }[];
  const updatedOptions = options.map((opt) => ({
    ...opt,
    vote_count: optionIds.includes(opt.id)
      ? opt.vote_count + 1
      : opt.vote_count,
  }));

  const { error: updateError } = await supabase
    .from("broadcast_polls")
    .update({
      options: updatedOptions,
      total_votes: (poll as BroadcastPoll).total_votes + 1,
    })
    .eq("id", pollId);

  if (updateError) throw updateError;
}

/**
 * Anket sonuçlarını getirir
 */
export async function getBroadcastPoll(
  pollId: string
): Promise<BroadcastPoll | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("broadcast_polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (error) throw error;

  // Kullanıcının oyunu ekle
  if (user && data) {
    const { data: myVote } = await supabase
      .from("broadcast_poll_votes")
      .select("option_ids")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    return { ...data, my_votes: myVote?.option_ids };
  }

  return data;
}
