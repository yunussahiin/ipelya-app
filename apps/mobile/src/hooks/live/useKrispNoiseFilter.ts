/**
 * Krisp Noise Filter Hook
 * LiveKit için gelişmiş gürültü engelleme
 * @livekit/react-native-krisp-noise-filter paketi gerekli
 */

import { useEffect, useMemo, useCallback, useState } from 'react';
import type { LocalAudioTrack } from '@livekit/react-native';

// Krisp paketi opsiyonel - yüklü değilse hata vermez
let KrispNoiseFilter: (() => any) | null = null;

try {
  // Dynamic import - paket yüklü değilse hata vermez
  const krispModule = require('@livekit/react-native-krisp-noise-filter');
  KrispNoiseFilter = krispModule.KrispNoiseFilter;
} catch {
  console.log('[Krisp] @livekit/react-native-krisp-noise-filter paketi yüklü değil');
}

export interface UseKrispNoiseFilterOptions {
  /** Krisp'i otomatik aktifleştir */
  autoEnable?: boolean;
}

export interface UseKrispNoiseFilterResult {
  /** Krisp processor instance */
  processor: any | null;
  /** Krisp aktif mi */
  isEnabled: boolean;
  /** Krisp destekleniyor mu */
  isSupported: boolean;
  /** Krisp'i aktifleştir/devre dışı bırak */
  setEnabled: (enabled: boolean) => void;
  /** Track'e Krisp processor'ı ekle */
  applyToTrack: (track: LocalAudioTrack | null) => Promise<void>;
}

/**
 * Krisp Noise Filter Hook
 * React Native için gelişmiş gürültü engelleme
 */
export function useKrispNoiseFilter(
  options: UseKrispNoiseFilterOptions = {}
): UseKrispNoiseFilterResult {
  const { autoEnable = true } = options;
  
  const [isEnabled, setIsEnabled] = useState(autoEnable);
  const isSupported = KrispNoiseFilter !== null;

  // Krisp processor instance - memoized
  const processor = useMemo(() => {
    if (!isSupported) return null;
    try {
      return KrispNoiseFilter!();
    } catch (error) {
      console.warn('[Krisp] Processor oluşturulamadı:', error);
      return null;
    }
  }, [isSupported]);

  // Track'e processor ekle
  const applyToTrack = useCallback(async (track: LocalAudioTrack | null) => {
    if (!track || !processor) return;
    
    try {
      await track.setProcessor(processor);
      console.log('[Krisp] Noise filter track\'e uygulandı');
    } catch (error) {
      console.warn('[Krisp] Track\'e uygulanamadı:', error);
    }
  }, [processor]);

  // Enable/disable toggle
  const handleSetEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    // Not: Krisp React Native SDK'da setEnabled metodu yok
    // Bypass için farklı bir yaklaşım gerekebilir
  }, []);

  return {
    processor,
    isEnabled,
    isSupported,
    setEnabled: handleSetEnabled,
    applyToTrack,
  };
}

export default useKrispNoiseFilter;
