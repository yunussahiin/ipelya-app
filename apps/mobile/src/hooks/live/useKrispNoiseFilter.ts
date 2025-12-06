/**
 * Krisp Noise Filter Hook
 * LiveKit için gelişmiş gürültü engelleme
 * @livekit/react-native-krisp-noise-filter paketi gerekli
 */

import { useMemo, useCallback, useState } from 'react';

// LocalAudioTrack type for Krisp processor
interface LocalAudioTrack {
  setProcessor?: (processor: unknown) => Promise<void>;
}

// Krisp paketi opsiyonel - yüklü değilse hata vermez
let KrispNoiseFilter: (() => unknown) | null = null;

// Dynamic import at module level
(async () => {
  try {
    const krispModule = await import('@livekit/react-native-krisp-noise-filter');
    KrispNoiseFilter = krispModule.KrispNoiseFilter;
  } catch {
    // Krisp paketi yüklü değil - sessizce devam et
  }
})();

export interface UseKrispNoiseFilterOptions {
  /** Krisp'i otomatik aktifleştir */
  autoEnable?: boolean;
}

export interface UseKrispNoiseFilterResult {
  /** Krisp processor instance */
  processor: unknown | null;
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
    } catch {
      return null;
    }
  }, [isSupported]);

  // Track'e processor ekle
  const applyToTrack = useCallback(async (track: LocalAudioTrack | null) => {
    if (!track || !processor || !track.setProcessor) return;
    
    try {
      await track.setProcessor(processor);
    } catch {
      // Krisp track'e uygulanamadı
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
