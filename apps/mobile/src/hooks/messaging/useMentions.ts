/**
 * useMentions Hook
 *
 * Amaç: Mesajlardaki mention'ları parse etme ve bildirim gönderme
 * Tarih: 2025-11-26
 *
 * @username formatındaki mention'ları algılar ve
 * ilgili kullanıcılara bildirim gönderir.
 */

import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

// =============================================
// TYPES
// =============================================

interface ParsedMention {
  username: string;
  userId: string | null;
  startIndex: number;
  endIndex: number;
}

interface MentionUser {
  user_id: string;
  username: string;
  display_name: string;
}

// =============================================
// REGEX
// =============================================

// @username formatını yakala (alfanumerik ve alt çizgi)
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

// =============================================
// HOOK
// =============================================

export function useMentions() {
  /**
   * Mesaj içindeki mention'ları parse eder
   */
  const parseMentions = useCallback((text: string): ParsedMention[] => {
    const mentions: ParsedMention[] = [];
    let match;

    while ((match = MENTION_REGEX.exec(text)) !== null) {
      mentions.push({
        username: match[1],
        userId: null, // Sonra doldurulacak
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    // Regex'i sıfırla
    MENTION_REGEX.lastIndex = 0;

    return mentions;
  }, []);

  /**
   * Username'leri user ID'lere çevirir
   */
  const resolveUsernames = useCallback(
    async (usernames: string[]): Promise<Map<string, MentionUser>> => {
      if (usernames.length === 0) return new Map();

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("username", usernames);

      if (error) {
        console.error("[Mentions] Kullanıcılar çözümlenemedi:", error);
        return new Map();
      }

      const userMap = new Map<string, MentionUser>();
      data?.forEach((user) => {
        userMap.set(user.username.toLowerCase(), user);
      });

      return userMap;
    },
    []
  );

  /**
   * Mesajdaki mention'ları işler ve bildirim gönderir
   */
  const processMentions = useCallback(
    async (
      messageId: string,
      conversationId: string,
      content: string,
      senderId: string
    ) => {
      // Mention'ları parse et
      const mentions = parseMentions(content);
      if (mentions.length === 0) return [];

      // Unique username'leri al
      const usernames = [...new Set(mentions.map((m) => m.username.toLowerCase()))];

      // Username'leri çözümle
      const userMap = await resolveUsernames(usernames);

      // Mention kayıtlarını oluştur
      const mentionRecords = mentions
        .filter((m) => userMap.has(m.username.toLowerCase()))
        .map((m) => {
          const user = userMap.get(m.username.toLowerCase())!;
          return {
            message_id: messageId,
            user_id: user.user_id,
            mentioned_by: senderId,
          };
        });

      if (mentionRecords.length === 0) return [];

      // Mention'ları veritabanına kaydet
      const { error: insertError } = await supabase
        .from("message_mentions")
        .insert(mentionRecords);

      if (insertError) {
        console.error("[Mentions] Mention'lar kaydedilemedi:", insertError);
        return [];
      }

      // Bildirim gönder (Edge Function tetikleyecek)
      console.log(`[Mentions] ${mentionRecords.length} mention işlendi`);

      return mentionRecords.map((r) => r.user_id);
    },
    [parseMentions, resolveUsernames]
  );

  /**
   * Mention önerileri için kullanıcı arama
   */
  const searchMentionUsers = useCallback(
    async (query: string, conversationId?: string): Promise<MentionUser[]> => {
      if (!query || query.length < 1) return [];

      let queryBuilder = supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .or(`username.ilike.${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      // Eğer conversation varsa, katılımcıları önceliklendir
      if (conversationId) {
        // TODO: Conversation katılımcılarını önceliklendir
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error("[Mentions] Kullanıcı araması başarısız:", error);
        return [];
      }

      return data || [];
    },
    []
  );

  /**
   * Mesaj içindeki mention'ları highlight eder (render için)
   */
  const highlightMentions = useCallback(
    (text: string): { text: string; isMention: boolean }[] => {
      const parts: { text: string; isMention: boolean }[] = [];
      let lastIndex = 0;
      let match;

      while ((match = MENTION_REGEX.exec(text)) !== null) {
        // Mention öncesi metin
        if (match.index > lastIndex) {
          parts.push({
            text: text.slice(lastIndex, match.index),
            isMention: false,
          });
        }

        // Mention
        parts.push({
          text: match[0],
          isMention: true,
        });

        lastIndex = match.index + match[0].length;
      }

      // Kalan metin
      if (lastIndex < text.length) {
        parts.push({
          text: text.slice(lastIndex),
          isMention: false,
        });
      }

      // Regex'i sıfırla
      MENTION_REGEX.lastIndex = 0;

      return parts;
    },
    []
  );

  return {
    parseMentions,
    resolveUsernames,
    processMentions,
    searchMentionUsers,
    highlightMentions,
  };
}
