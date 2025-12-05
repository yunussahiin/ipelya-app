/**
 * Live Chat Hook
 * Canlı yayın sohbet yönetimi
 * Realtime subscription ve mesaj gönderme
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage } from '@/components/live/LiveChat';

interface UseLiveChatOptions {
  sessionId: string;
  maxMessages?: number;
  onNewMessage?: (message: ChatMessage) => void;
}

interface UseLiveChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  clearMessages: () => void;
}

export function useLiveChat({
  sessionId,
  maxMessages = 100,
  onNewMessage,
}: UseLiveChatOptions): UseLiveChatResult {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // İlk mesajları yükle
  useEffect(() => {
    if (!sessionId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('live_messages')
          .select(`
            id,
            sender_id,
            content,
            message_type,
            gift_id,
            gift_quantity,
            gift_coin_value,
            created_at,
            profiles:sender_profile_id (
              display_name,
              avatar_url
            )
          `)
          .eq('session_id', sessionId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })
          .limit(maxMessages);

        if (fetchError) throw fetchError;

        // Session host ID'sini al
        const { data: session } = await supabase
          .from('live_sessions')
          .select('creator_id')
          .eq('id', sessionId)
          .maybeSingle();

        const hostId = session?.creator_id;

        interface LiveMessageRow {
          id: string;
          sender_id: string;
          content?: string;
          message_type?: string;
          gift_id?: string;
          gift_quantity?: number;
          gift_coin_value?: number;
          created_at: string;
          profiles?: {
            display_name?: string;
            avatar_url?: string;
          };
        }

        const formattedMessages: ChatMessage[] = (data as LiveMessageRow[] || []).map((msg) => ({
          id: msg.id,
          userId: msg.sender_id,
          userName: msg.profiles?.display_name || 'Kullanıcı',
          userAvatar: msg.profiles?.avatar_url,
          text: msg.content || '',
          isHost: msg.sender_id === hostId,
          isGift: msg.message_type === 'gift',
          giftName: msg.gift_id ? `Gift #${msg.gift_id}` : undefined,
          giftAmount: msg.gift_coin_value,
          createdAt: msg.created_at,
        }));

        setMessages(formattedMessages);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Mesajlar yüklenemedi'));
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, maxMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live_chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            sender_id: string;
            sender_profile_id?: string;
            content?: string;
            message_type?: string;
            gift_id?: string;
            gift_quantity?: number;
            gift_coin_value?: number;
            created_at: string;
          };
          
          // Kullanıcı bilgilerini al
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .eq('type', 'real')
            .single();

          // Session host ID'sini al
          const { data: session } = await supabase
            .from('live_sessions')
            .select('creator_id')
            .eq('id', sessionId)
            .single();

          const message: ChatMessage = {
            id: newMsg.id,
            userId: newMsg.sender_id,
            userName: profile?.display_name || 'Kullanıcı',
            userAvatar: profile?.avatar_url,
            text: newMsg.content || '',
            isHost: newMsg.sender_id === session?.creator_id,
            isGift: newMsg.message_type === 'gift',
            giftName: newMsg.gift_id ? `Gift #${newMsg.gift_id}` : undefined,
            giftAmount: newMsg.gift_coin_value,
            createdAt: newMsg.created_at,
          };

          setMessages((prev) => {
            const updated = [...prev, message];
            // Max mesaj sayısını aşarsa eski mesajları sil
            if (updated.length > maxMessages) {
              return updated.slice(-maxMessages);
            }
            return updated;
          });

          onNewMessage?.(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; is_deleted?: boolean };
          if (updated.is_deleted) {
            // Silinen mesajı listeden kaldır
            setMessages((prev) => prev.filter((m) => m.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, maxMessages, onNewMessage]);

  // Mesaj gönder
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!user?.id || !sessionId || !text.trim()) return false;

    try {
      // Önce kullanıcının profile_id'sini al
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'real')
        .single();

      const { error: insertError } = await supabase.from('live_messages').insert({
        session_id: sessionId,
        sender_id: user.id,
        sender_profile_id: profile?.id,
        content: text.trim(),
        message_type: 'text',
      });

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('Message send error:', err);
      return false;
    }
  }, [user?.id, sessionId]);

  // Mesaj sil (soft delete)
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error: updateError } = await supabase
        .from('live_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      console.error('Message delete error:', err);
      return false;
    }
  }, [user?.id]);

  // Mesajları temizle (local only)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    clearMessages,
  };
}
