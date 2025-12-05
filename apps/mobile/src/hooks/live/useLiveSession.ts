/**
 * Live Session Hook
 * Canlı yayın oturumu oluşturma, katılma ve yönetme
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface LiveSession {
  id: string;
  roomName: string;
  title: string;
  sessionType: 'video_live' | 'audio_room';
  accessType: 'public' | 'subscribers_only' | 'pay_per_view';
  status: string;
  creatorId: string;
  chatEnabled: boolean;
  giftsEnabled: boolean;
  guestEnabled: boolean;
  maxGuests: number;
  viewerCount?: number;
  startedAt?: string;
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface JoinSessionParams {
  sessionId: string;
}

export interface CreateSessionParams {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  sessionType: 'video_live' | 'audio_room';
  accessType?: 'public' | 'subscribers_only' | 'pay_per_view';
  ppvCoinPrice?: number;
  chatEnabled?: boolean;
  giftsEnabled?: boolean;
  guestEnabled?: boolean;
  maxGuests?: number;
}

export interface UseLiveSessionResult {
  session: LiveSession | null;
  activeSession: LiveSession | null;
  isLoading: boolean;
  error: Error | null;
  createSession: (params: CreateSessionParams) => Promise<LiveSession | null>;
  joinSession: (params: JoinSessionParams | string) => Promise<LiveSession | null>;
  endSession: (reason?: string) => Promise<void>;
  leaveSession: (sessionId?: string) => Promise<void>;
}

export function useLiveSession(): UseLiveSessionResult {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Yeni oturum oluştur
  const createSession = useCallback(async (params: CreateSessionParams): Promise<LiveSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-live-session', {
        body: {
          title: params.title,
          description: params.description,
          thumbnailUrl: params.thumbnailUrl,
          sessionType: params.sessionType,
          accessType: params.accessType || 'public',
          ppvCoinPrice: params.ppvCoinPrice || 0,
          chatEnabled: params.chatEnabled ?? true,
          giftsEnabled: params.giftsEnabled ?? true,
          guestEnabled: params.guestEnabled ?? true,
          maxGuests: params.maxGuests || 3,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Oturum oluşturulamadı');
      }

      const newSession: LiveSession = {
        id: data.session.id,
        roomName: data.session.roomName,
        title: data.session.title,
        sessionType: data.session.sessionType,
        accessType: data.session.accessType,
        status: data.session.status,
        creatorId: '', // Backend'den dönecek
        chatEnabled: params.chatEnabled ?? true,
        giftsEnabled: params.giftsEnabled ?? true,
        guestEnabled: params.guestEnabled ?? true,
        maxGuests: params.maxGuests || 3,
      };

      setSession(newSession);
      return newSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Oturum oluşturma hatası');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mevcut oturuma katıl
  const joinSession = useCallback(async (params: JoinSessionParams | string): Promise<LiveSession | null> => {
    const sessionId = typeof params === 'string' ? params : params.sessionId;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('join-live-session', {
        body: { sessionId },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        // Özel hata durumları
        if (data.requiresSubscription) {
          throw new Error('Bu yayın sadece abonelere açık');
        }
        if (data.requiresPayment) {
          throw new Error(`Bu yayını izlemek için ${data.required} coin gerekli`);
        }
        throw new Error(data.error || 'Oturuma katılınamadı');
      }

      const joinedSession: LiveSession = {
        id: data.session.id,
        roomName: data.session.roomName,
        title: data.session.title,
        sessionType: data.session.sessionType,
        accessType: 'public',
        status: 'live',
        creatorId: '',
        chatEnabled: data.session.chatEnabled,
        giftsEnabled: data.session.giftsEnabled,
        guestEnabled: true,
        maxGuests: 3,
        startedAt: data.session.startedAt,
        creator: data.session.creator,
      };

      setSession(joinedSession);
      return joinedSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Oturuma katılma hatası');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Oturumu sonlandır (host için)
  const endSession = useCallback(async (reason?: string): Promise<void> => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('end-live-session', {
        body: { sessionId: session.id, reason },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Oturum sonlandırılamadı');
      }

      setSession(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Oturum sonlandırma hatası');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Oturumdan ayrıl (viewer için)
  const leaveSession = useCallback(async (_sessionId?: string): Promise<void> => {
    // Basit cleanup - client tarafında session'ı null yap
    // LiveKit bağlantısını kesme işlemi useLiveKitRoom'da yapılıyor
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    activeSession: session, // Alias for compatibility
    isLoading,
    error,
    createSession,
    joinSession,
    endSession,
    leaveSession,
  };
}
