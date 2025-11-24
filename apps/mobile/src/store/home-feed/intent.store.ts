/**
 * Intent Store (Zustand)
 * 
 * Amaç: Dating intent state management
 * 
 * State:
 * - intents: Kullanıcının intent'leri (priority ile)
 * 
 * Actions:
 * - setIntents: Intent'leri güncelle
 * - addIntent: Yeni intent ekle
 * - removeIntent: Intent kaldır
 * - updatePriority: Priority güncelle
 * 
 * Kullanım:
 * const { intents, setIntents } = useIntentStore();
 */

import { create } from 'zustand';
import type { IntentType } from '@ipelya/types';

interface Intent {
  intent_type: IntentType;
  priority: number; // 1-5
}

interface IntentState {
  // Intents
  intents: Intent[];
  
  // Actions
  setIntents: (intents: Intent[]) => void;
  addIntent: (intent: Intent) => void;
  removeIntent: (intentType: IntentType) => void;
  updatePriority: (intentType: IntentType, priority: number) => void;
}

export const useIntentStore = create<IntentState>((set) => ({
  // Initial state
  intents: [],
  
  // Actions
  setIntents: (intents) => set({ intents }),
  
  addIntent: (intent) =>
    set((state) => ({
      intents: [...state.intents, intent],
    })),
  
  removeIntent: (intentType) =>
    set((state) => ({
      intents: state.intents.filter((i) => i.intent_type !== intentType),
    })),
  
  updatePriority: (intentType, priority) =>
    set((state) => ({
      intents: state.intents.map((i) =>
        i.intent_type === intentType ? { ...i, priority } : i
      ),
    })),
}));
