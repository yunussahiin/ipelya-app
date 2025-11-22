# Shadow Profil - Teknik Implementasyon

## 📁 Dosya Yapısı

```
apps/mobile/src/
├── hooks/
│   ├── useShadowMode.ts          # Shadow mode geçiş logic
│   └── useShadowProfile.ts       # Shadow profil CRUD
├── store/
│   └── shadow.store.ts           # Shadow state management (Zustand)
├── components/
│   ├── ShadowToggle.tsx          # Mode toggle UI
│   ├── ShadowPinModal.tsx        # PIN verification modal
│   └── ShadowProfileEditor.tsx   # Shadow profil düzenleme
└── utils/
    └── crypto.ts                 # PIN hash/verify utilities
```

## 🔧 Hook: useShadowMode

```typescript
// hooks/useShadowMode.ts
import { useState, useCallback } from 'react';
import { verifyPin } from '@/utils/crypto';
import { supabase } from '@/lib/supabase';
import { useShadowStore } from '@/store/shadow.store';

export function useShadowMode() {
  const [loading, setLoading] = useState(false);
  const { enabled, toggle, setPinState } = useShadowStore();

  /**
   * Get current user's profile info
   */
  const getCurrentProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', enabled ? 'shadow' : 'real')
      .single();

    return profile;
  }, [enabled]);

  /**
   * Verify shadow PIN
   */
  const verifyShadowPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('shadow_pin_hash')
        .eq('user_id', user.id)
        .eq('type', 'real')
        .single();

      if (!profile?.shadow_pin_hash) return false;

      return await verifyPin(pin, profile.shadow_pin_hash);
    } catch (error) {
      console.error('PIN verification error:', error);
      return false;
    }
  }, []);

  /**
   * Toggle shadow mode
   */
  const toggleShadowMode = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      // Verify PIN
      const isValid = await verifyShadowPin(pin);
      if (!isValid) {
        throw new Error('Invalid PIN');
      }

      // Update shadow_unlocked status
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('profiles')
        .update({
          shadow_unlocked: !enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user!.id)
        .eq('type', 'real');

      // Toggle local state
      toggle();

      // Log audit
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user!.id,
          action: enabled ? 'shadow_mode_exit' : 'shadow_mode_enter',
          timestamp: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Toggle shadow mode error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enabled, toggle, verifyShadowPin]);

  /**
   * Verify biometric
   */
  const verifyBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Shadow profiline geçiş yap',
        fallbackLabel: 'PIN kullan',
        disableDeviceFallback: false
      });

      return result.success;
    } catch (error) {
      console.error('Biometric verification error:', error);
      return false;
    }
  }, []);

  return {
    enabled,
    loading,
    getCurrentProfile,
    verifyShadowPin,
    toggleShadowMode,
    verifyBiometric
  };
}
```

## 🗄️ Store: shadow.store.ts

```typescript
// store/shadow.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ShadowState = {
  enabled: boolean;
  pinSet: boolean;
  lastToggleAt: string | null;
  toggle: (next?: boolean) => void;
  setPinState: (pinEnabled: boolean) => void;
  setLastToggle: (timestamp: string) => void;
};

export const useShadowStore = create<ShadowState>()(
  persist(
    (set) => ({
      enabled: false,
      pinSet: false,
      lastToggleAt: null,
      toggle: (next) =>
        set((state) => ({
          enabled: typeof next === 'boolean' ? next : !state.enabled
        })),
      setPinState: (pinEnabled) => set({ pinSet: pinEnabled }),
      setLastToggle: (timestamp) => set({ lastToggleAt: timestamp })
    }),
    {
      name: 'shadow-storage'
    }
  )
);
```

## 🔐 Crypto Utilities

```typescript
// utils/crypto.ts
import * as Crypto from 'expo-crypto';

/**
 * Hash a PIN using SHA-256
 */
export async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin
  );
}

/**
 * Verify a PIN against a hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === hash;
}
```

## 🎨 Component: ShadowToggle

```typescript
// components/ShadowToggle.tsx
import { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useShadowMode } from '@/hooks/useShadowMode';
import { ShadowPinModal } from './ShadowPinModal';

export function ShadowToggle() {
  const { enabled, loading, toggleShadowMode, verifyBiometric } = useShadowMode();
  const [showPinModal, setShowPinModal] = useState(false);

  const handlePress = async () => {
    // Try biometric first
    const biometricSuccess = await verifyBiometric();
    if (biometricSuccess) {
      await toggleShadowMode(''); // No PIN needed
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    try {
      await toggleShadowMode(pin);
      setShowPinModal(false);
    } catch (error) {
      alert('Hatalı PIN');
    }
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={[styles.toggle, enabled && styles.toggleActive]}
      >
        <Text style={styles.toggleText}>
          {enabled ? '🎭 Shadow Mode (Aktif)' : '👤 Normal Mode'}
        </Text>
        <Text style={styles.toggleSubtext}>
          {enabled ? 'Normal moda geç' : 'Shadow moda geç'}
        </Text>
      </Pressable>

      <ShadowPinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  toggle: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#ddd'
  },
  toggleActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333'
  },
  toggleText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  toggleSubtext: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7
  }
});
```

## 🔒 Component: ShadowPinModal

```typescript
// components/ShadowPinModal.tsx
import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
};

export function ShadowPinModal({ visible, onClose, onSubmit }: Props) {
  const [pin, setPin] = useState('');

  const handleSubmit = () => {
    if (pin.length >= 4) {
      onSubmit(pin);
      setPin('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Shadow PIN Gir</Text>
          
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="PIN"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text>İptal</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={pin.length < 4}
            >
              <Text style={styles.buttonPrimaryText}>Doğrula</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center'
  },
  buttonPrimary: {
    backgroundColor: '#000'
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
```

## 📊 Database Functions

### RLS Policies

```sql
-- Real profile sadece owner erişebilir
CREATE POLICY "Users can view own real profile"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id AND type = 'real'
);

-- Shadow profile herkes görebilir (anonim)
CREATE POLICY "Anyone can view shadow profiles"
ON profiles FOR SELECT
USING (type = 'shadow');

-- Shadow profile sadece owner güncelleyebilir
CREATE POLICY "Users can update own shadow profile"
ON profiles FOR UPDATE
USING (
  auth.uid() = user_id AND type = 'shadow'
);
```

### Helper Functions

```sql
-- Get active profile type for user
CREATE OR REPLACE FUNCTION get_active_profile_type(user_id UUID)
RETURNS TEXT AS $$
  SELECT CASE 
    WHEN shadow_unlocked THEN 'shadow'
    ELSE 'real'
  END
  FROM profiles
  WHERE user_id = $1 AND type = 'real';
$$ LANGUAGE SQL STABLE;

-- Switch shadow mode
CREATE OR REPLACE FUNCTION toggle_shadow_mode(user_id UUID)
RETURNS VOID AS $$
  UPDATE profiles
  SET 
    shadow_unlocked = NOT shadow_unlocked,
    updated_at = NOW()
  WHERE user_id = $1 AND type = 'real';
$$ LANGUAGE SQL;
```

## 🚀 Deployment Checklist

- [ ] Shadow store implementasyonu
- [ ] useShadowMode hook'u
- [ ] ShadowToggle component'i
- [ ] ShadowPinModal component'i
- [ ] Crypto utilities
- [ ] RLS policies
- [ ] Database functions
- [ ] Audit logging
- [ ] Error handling
- [ ] Testing (unit + integration)
- [ ] Documentation
