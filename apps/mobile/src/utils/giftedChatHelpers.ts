/**
 * Gifted Chat Helpers
 * 
 * İpelya mesaj formatı ile Gifted Chat IMessage formatı arasında dönüşüm
 */

import type { IMessage } from 'react-native-gifted-chat';
import type { Message, CreateMessageRequest } from '@ipelya/types';

/**
 * Reaction type
 */
export interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

/**
 * Extended IMessage with reply, audio duration, and reactions support
 */
export interface IMessageWithReply extends IMessage {
  replyTo?: {
    _id: string;
    text: string;
    user: {
      _id: string;
      name: string;
    };
  };
  audioDuration?: number; // saniye cinsinden
  reactions?: MessageReaction[];
}

/**
 * İpelya Message -> Gifted Chat IMessage
 */
export function toGiftedMessage(message: Message): IMessageWithReply {
  const isPending = 'tempId' in message;
  
  // Reply bilgisi - Supabase array veya obje dönebilir
  const rawReplyToData = (message as any).reply_to;
  // Array ise ilk elemanı al, değilse direkt kullan
  const rawReplyTo = Array.isArray(rawReplyToData) ? rawReplyToData[0] : rawReplyToData;
  const hasValidReply = message.reply_to_id && rawReplyTo && rawReplyTo.id;
  
  // Debug: reply_to kontrolü
  // if (message.reply_to_id) {
  //   console.log("[toGiftedMessage] reply_to_id:", message.reply_to_id, "hasValidReply:", hasValidReply, "rawReplyTo:", rawReplyTo);
  // }
  
  const replyTo = hasValidReply ? {
    _id: rawReplyTo.id,
    text: rawReplyTo.content || '',
    user: {
      _id: rawReplyTo.sender_id,
      name: rawReplyTo.sender_profile?.display_name || 'Kullanıcı',
    },
  } : undefined;
  
  return {
    _id: isPending ? (message as any).tempId : message.id,
    text: message.content || '',
    createdAt: new Date(message.created_at),
    user: {
      _id: message.sender_id,
      name: message.sender_profile?.display_name || 'Kullanıcı',
      avatar: message.sender_profile?.avatar_url || undefined,
    },
    image: message.content_type === 'image' ? message.media_url || undefined : undefined,
    video: message.content_type === 'video' ? message.media_url || undefined : undefined,
    audio: message.content_type === 'audio' ? message.media_url || undefined : undefined,
    // Audio duration (saniye cinsinden)
    audioDuration: message.media_metadata?.duration,
    // Message status
    sent: message.status === 'sent' || message.status === 'delivered' || message.status === 'read',
    received: message.status === 'delivered' || message.status === 'read',
    pending: isPending || message.status === 'sending',
    // Reply
    replyTo,
  };
}

/**
 * Gifted Chat IMessage -> İpelya CreateMessageRequest
 */
export function toCreateRequest(
  message: IMessage, 
  conversationId: string
): CreateMessageRequest {
  return {
    conversation_id: conversationId,
    content: message.text,
    content_type: message.image ? 'image' : message.video ? 'video' : 'text',
    media_url: message.image || message.video || undefined,
  };
}

/**
 * Mesajları Gifted Chat formatına dönüştür
 * Not: Gifted Chat en yeni mesajı ilk sırada bekler
 */
export function toGiftedMessages(messages: Message[]): IMessage[] {
  return messages.map(toGiftedMessage);
}

/**
 * Yeni mesajı mevcut listeye ekle (Gifted Chat formatında)
 */
export function appendMessage(
  previousMessages: IMessage[],
  newMessage: IMessage
): IMessage[] {
  // Duplicate kontrolü
  const exists = previousMessages.some(m => m._id === newMessage._id);
  if (exists) return previousMessages;
  
  // Yeni mesaj en başa eklenir (Gifted Chat inverted list)
  return [newMessage, ...previousMessages];
}

/**
 * Pending mesajı gerçek mesajla değiştir
 */
export function replacePendingMessage(
  messages: IMessage[],
  tempId: string,
  realMessage: IMessage
): IMessage[] {
  return messages.map(m => 
    m._id === tempId ? realMessage : m
  );
}

/**
 * Pending mesajı kaldır
 */
export function removePendingMessage(
  messages: IMessage[],
  tempId: string
): IMessage[] {
  return messages.filter(m => m._id !== tempId);
}
