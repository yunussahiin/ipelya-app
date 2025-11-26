/**
 * Gifted Chat Helpers
 * 
 * İpelya mesaj formatı ile Gifted Chat IMessage formatı arasında dönüşüm
 */

import type { IMessage } from 'react-native-gifted-chat';
import type { Message, CreateMessageRequest } from '@ipelya/types';

/**
 * İpelya Message -> Gifted Chat IMessage
 */
export function toGiftedMessage(message: Message): IMessage {
  const isPending = 'tempId' in message;
  
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
    // Message status
    sent: message.status === 'sent' || message.status === 'delivered' || message.status === 'read',
    received: message.status === 'delivered' || message.status === 'read',
    pending: isPending || message.status === 'sending',
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
