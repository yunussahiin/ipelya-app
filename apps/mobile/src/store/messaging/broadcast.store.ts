/**
 * Broadcast Store
 *
 * Amaç: Creator yayın kanalı state yönetimi
 * Tarih: 2025-11-26
 *
 * Bu store, yayın kanallarını ve kanal mesajlarını yönetir.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BroadcastChannel, BroadcastMessage } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastState {
  // State
  myChannels: BroadcastChannel[]; // Creator'ın kendi kanalları
  joinedChannels: BroadcastChannel[]; // Üye olunan kanallar
  activeChannelId: string | null;
  messages: Record<string, BroadcastMessage[]>; // channelId -> messages
  isLoading: boolean;
  error: string | null;

  // Channel Actions
  setMyChannels: (channels: BroadcastChannel[]) => void;
  setJoinedChannels: (channels: BroadcastChannel[]) => void;
  addChannel: (channel: BroadcastChannel, isMine: boolean) => void;
  updateChannel: (id: string, updates: Partial<BroadcastChannel>) => void;
  removeChannel: (id: string) => void;
  setActiveChannel: (id: string | null) => void;

  // Message Actions
  setMessages: (channelId: string, messages: BroadcastMessage[]) => void;
  addMessage: (channelId: string, message: BroadcastMessage) => void;
  addMessages: (channelId: string, messages: BroadcastMessage[]) => void;
  updateMessage: (
    channelId: string,
    messageId: string,
    updates: Partial<BroadcastMessage>
  ) => void;

  // Utils
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// =============================================
// INITIAL STATE
// =============================================

const initialState = {
  myChannels: [],
  joinedChannels: [],
  activeChannelId: null,
  messages: {},
  isLoading: false,
  error: null,
};

// =============================================
// STORE
// =============================================

export const useBroadcastStore = create<BroadcastState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Creator'ın kendi kanallarını set eder
       */
      setMyChannels: (channels) => set({ myChannels: channels }),

      /**
       * Üye olunan kanalları set eder
       */
      setJoinedChannels: (channels) => set({ joinedChannels: channels }),

      /**
       * Yeni kanal ekler
       */
      addChannel: (channel, isMine) => {
        set((state) => {
          if (isMine) {
            return {
              myChannels: [
                channel,
                ...state.myChannels.filter((c) => c.id !== channel.id),
              ],
            };
          }
          return {
            joinedChannels: [
              channel,
              ...state.joinedChannels.filter((c) => c.id !== channel.id),
            ],
          };
        });
      },

      /**
       * Kanalı günceller
       */
      updateChannel: (id, updates) => {
        set((state) => ({
          myChannels: state.myChannels.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
          joinedChannels: state.joinedChannels.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      /**
       * Kanalı kaldırır
       */
      removeChannel: (id) => {
        set((state) => ({
          myChannels: state.myChannels.filter((c) => c.id !== id),
          joinedChannels: state.joinedChannels.filter((c) => c.id !== id),
          activeChannelId:
            state.activeChannelId === id ? null : state.activeChannelId,
        }));
      },

      /**
       * Aktif kanalı set eder
       */
      setActiveChannel: (id) => set({ activeChannelId: id }),

      /**
       * Kanal mesajlarını set eder
       */
      setMessages: (channelId, messages) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: messages,
          },
        }));
      },

      /**
       * Yeni mesaj ekler (başa)
       */
      addMessage: (channelId, message) => {
        set((state) => {
          const existing = state.messages[channelId] || [];
          if (existing.some((m) => m.id === message.id)) {
            return state;
          }
          return {
            messages: {
              ...state.messages,
              [channelId]: [message, ...existing],
            },
          };
        });
      },

      /**
       * Birden fazla mesaj ekler (sona - pagination)
       */
      addMessages: (channelId, messages) => {
        set((state) => {
          const existing = state.messages[channelId] || [];
          const existingIds = new Set(existing.map((m) => m.id));
          const newMessages = messages.filter((m) => !existingIds.has(m.id));
          return {
            messages: {
              ...state.messages,
              [channelId]: [...existing, ...newMessages],
            },
          };
        });
      },

      /**
       * Mesajı günceller
       */
      updateMessage: (channelId, messageId, updates) => {
        set((state) => {
          const messages = state.messages[channelId] || [];
          return {
            messages: {
              ...state.messages,
              [channelId]: messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
            },
          };
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
      name: "ipelya-broadcast",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        myChannels: state.myChannels,
        joinedChannels: state.joinedChannels,
      }),
    }
  )
);

// =============================================
// SELECTORS
// =============================================

/**
 * Tüm kanalları döndürür (kendi + üye)
 */
export const useAllChannels = () => {
  const myChannels = useBroadcastStore((state) => state.myChannels);
  const joinedChannels = useBroadcastStore((state) => state.joinedChannels);
  return [...myChannels, ...joinedChannels];
};

/**
 * Aktif kanalı döndürür
 */
export const useActiveChannel = () => {
  const myChannels = useBroadcastStore((state) => state.myChannels);
  const joinedChannels = useBroadcastStore((state) => state.joinedChannels);
  const activeId = useBroadcastStore((state) => state.activeChannelId);

  if (!activeId) return null;

  return (
    myChannels.find((c) => c.id === activeId) ||
    joinedChannels.find((c) => c.id === activeId) ||
    null
  );
};

/**
 * Kanal mesajlarını döndürür
 */
export const useChannelMessages = (channelId: string) => {
  return useBroadcastStore((state) => state.messages[channelId] || []);
};
