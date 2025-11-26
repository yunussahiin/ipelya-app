/**
 * Conversation Store
 *
 * Amaç: DM sohbet state yönetimi
 * Tarih: 2025-11-26
 *
 * Bu store, kullanıcının sohbetlerini ve aktif sohbet durumunu yönetir.
 * Zustand ile persist desteği sağlar.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Conversation, ConversationListItem } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface ConversationState {
  // State
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  unreadTotal: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: ConversationListItem[]) => void;
  addConversation: (conversation: ConversationListItem) => void;
  updateConversation: (
    id: string,
    updates: Partial<ConversationListItem>
  ) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// =============================================
// INITIAL STATE
// =============================================

const initialState = {
  conversations: [],
  activeConversationId: null,
  unreadTotal: 0,
  isLoading: false,
  error: null,
};

// =============================================
// STORE
// =============================================

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Tüm sohbetleri set eder
       */
      setConversations: (conversations) => {
        const unreadTotal = conversations.reduce(
          (sum, c) => sum + (c.unread_count || 0),
          0
        );
        set({ conversations, unreadTotal });
      },

      /**
       * Yeni sohbet ekler (başa)
       */
      addConversation: (conversation) => {
        set((state) => ({
          conversations: [
            conversation,
            ...state.conversations.filter((c) => c.id !== conversation.id),
          ],
        }));
      },

      /**
       * Sohbeti günceller
       */
      updateConversation: (id, updates) => {
        set((state) => {
          const conversations = state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          );

          // Unread total'ı yeniden hesapla
          const unreadTotal = conversations.reduce(
            (sum, c) => sum + (c.unread_count || 0),
            0
          );

          return { conversations, unreadTotal };
        });
      },

      /**
       * Sohbeti kaldırır
       */
      removeConversation: (id) => {
        set((state) => {
          const conversations = state.conversations.filter((c) => c.id !== id);
          const unreadTotal = conversations.reduce(
            (sum, c) => sum + (c.unread_count || 0),
            0
          );
          return {
            conversations,
            unreadTotal,
            activeConversationId:
              state.activeConversationId === id
                ? null
                : state.activeConversationId,
          };
        });
      },

      /**
       * Aktif sohbeti set eder
       */
      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      /**
       * Sohbetin okunmamış sayısını artırır
       */
      incrementUnread: (conversationId) => {
        set((state) => {
          // Aktif sohbette değilse artır
          if (state.activeConversationId === conversationId) {
            return state;
          }

          const conversations = state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, unread_count: (c.unread_count || 0) + 1 }
              : c
          );

          const unreadTotal = conversations.reduce(
            (sum, c) => sum + (c.unread_count || 0),
            0
          );

          return { conversations, unreadTotal };
        });
      },

      /**
       * Sohbetin okunmamış sayısını sıfırlar
       */
      resetUnread: (conversationId) => {
        set((state) => {
          const conversations = state.conversations.map((c) =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          );

          const unreadTotal = conversations.reduce(
            (sum, c) => sum + (c.unread_count || 0),
            0
          );

          return { conversations, unreadTotal };
        });
      },

      /**
       * Loading state'i set eder
       */
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Error state'i set eder
       */
      setError: (error) => set({ error }),

      /**
       * Store'u sıfırlar
       */
      reset: () => set(initialState),
    }),
    {
      name: "ipelya-conversations",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Sadece conversations'ı persist et
        conversations: state.conversations,
        unreadTotal: state.unreadTotal,
      }),
    }
  )
);

// =============================================
// SELECTORS
// =============================================

/**
 * Aktif sohbeti döndürür
 */
export const useActiveConversation = () => {
  return useConversationStore((state) => {
    const activeId = state.activeConversationId;
    return state.conversations.find((c) => c.id === activeId) || null;
  });
};

/**
 * Toplam okunmamış sayısını döndürür
 */
export const useUnreadTotal = () => {
  return useConversationStore((state) => state.unreadTotal);
};

/**
 * Belirli bir sohbetin okunmamış sayısını döndürür
 */
export const useConversationUnread = (conversationId: string) => {
  return useConversationStore(
    (state) =>
      state.conversations.find((c) => c.id === conversationId)?.unread_count ||
      0
  );
};
