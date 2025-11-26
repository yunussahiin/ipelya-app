/**
 * Presence Store
 *
 * Amaç: Online durumu ve typing indicator state yönetimi
 * Tarih: 2025-11-26
 *
 * Bu store, kullanıcıların online/offline durumunu ve
 * typing indicator'larını yönetir.
 */

import { create } from "zustand";
import type { UserPresence, PresenceStatus } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface PresenceState {
  // State
  onlineUsers: Record<string, UserPresence>; // userId -> presence
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  myStatus: PresenceStatus;

  // Actions
  setOnlineUser: (userId: string, presence: UserPresence) => void;
  removeOnlineUser: (userId: string) => void;
  setOnlineUsers: (users: Record<string, UserPresence>) => void;
  setTyping: (conversationId: string, userId: string) => void;
  clearTyping: (conversationId: string, userId: string) => void;
  clearAllTyping: (conversationId: string) => void;
  setMyStatus: (status: PresenceStatus) => void;
  reset: () => void;
}

// =============================================
// INITIAL STATE
// =============================================

const initialState = {
  onlineUsers: {},
  typingUsers: {},
  myStatus: "online" as PresenceStatus,
};

// =============================================
// STORE
// =============================================

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  ...initialState,

  /**
   * Kullanıcıyı online olarak işaretler
   */
  setOnlineUser: (userId, presence) => {
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: presence,
      },
    }));
  },

  /**
   * Kullanıcıyı offline olarak işaretler
   */
  removeOnlineUser: (userId) => {
    set((state) => {
      const { [userId]: _, ...onlineUsers } = state.onlineUsers;
      return { onlineUsers };
    });
  },

  /**
   * Tüm online kullanıcıları set eder (sync event)
   */
  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  /**
   * Kullanıcıyı typing olarak işaretler
   */
  setTyping: (conversationId, userId) => {
    console.log("[PresenceStore] setTyping called:", conversationId, userId);
    set((state) => {
      const existing = state.typingUsers[conversationId] || [];
      if (existing.includes(userId)) {
        console.log("[PresenceStore] User already typing, skipping");
        return state;
      }
      const newTypingUsers = {
        ...state.typingUsers,
        [conversationId]: [...existing, userId],
      };
      console.log("[PresenceStore] New typingUsers:", newTypingUsers);
      return { typingUsers: newTypingUsers };
    });
  },

  /**
   * Kullanıcının typing durumunu temizler
   */
  clearTyping: (conversationId, userId) => {
    console.log("[PresenceStore] clearTyping called:", conversationId, userId);
    set((state) => {
      const existing = state.typingUsers[conversationId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: existing.filter((id) => id !== userId),
        },
      };
    });
  },

  /**
   * Sohbetteki tüm typing durumlarını temizler
   */
  clearAllTyping: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...typingUsers } = state.typingUsers;
      return { typingUsers };
    });
  },

  /**
   * Kendi durumumu set eder
   */
  setMyStatus: (status) => set({ myStatus: status }),

  /**
   * Store'u sıfırlar
   */
  reset: () => set(initialState),
}));

// =============================================
// SELECTORS
// =============================================

/**
 * Kullanıcının online olup olmadığını döndürür
 */
export const useIsUserOnline = (userId: string) => {
  return usePresenceStore((state) => !!state.onlineUsers[userId]);
};

/**
 * Kullanıcının presence bilgisini döndürür
 */
export const useUserPresence = (userId: string) => {
  return usePresenceStore((state) => state.onlineUsers[userId] || null);
};

/**
 * Sohbette yazıyor olan kullanıcıları döndürür
 */
export const useTypingUsers = (conversationId: string) => {
  return usePresenceStore((state) => state.typingUsers[conversationId] || []);
};

/**
 * Sohbette birisi yazıyor mu döndürür
 */
export const useIsAnyoneTyping = (conversationId: string) => {
  return usePresenceStore(
    (state) => (state.typingUsers[conversationId] || []).length > 0
  );
};

/**
 * Online kullanıcı sayısını döndürür
 */
export const useOnlineCount = () => {
  return usePresenceStore((state) => Object.keys(state.onlineUsers).length);
};
