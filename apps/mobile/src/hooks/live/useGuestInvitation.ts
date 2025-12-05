/**
 * Guest Invitation Hook
 * Konuk davet sistemi - Host davet gönderir, Viewer talep eder
 * GUEST_COHOST.md referansı
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export type InvitationStatus = 'idle' | 'pending' | 'accepted' | 'rejected' | 'expired';
export type RequestStatus = 'idle' | 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface GuestInvitation {
  sessionId: string;
  hostName: string;
  hostAvatar?: string;
  sessionTitle: string;
  expiresAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message?: string;
  expiresAt: string;
}

export interface UseGuestInvitationOptions {
  sessionId: string;
  isHost: boolean;
  onInvitationReceived?: (invitation: GuestInvitation) => void;
  onRequestReceived?: (request: JoinRequest) => void;
  onBecameCoHost?: () => void;
  onGuestEnded?: () => void;
}

export interface UseGuestInvitationResult {
  // Host actions
  inviteGuest: (targetUserId: string) => Promise<boolean>;
  respondToRequest: (requestId: string, approve: boolean) => Promise<boolean>;
  endGuest: (guestUserId: string) => Promise<boolean>;
  pendingRequests: JoinRequest[];
  
  // Viewer actions
  requestToJoin: (message?: string) => Promise<boolean>;
  cancelRequest: () => Promise<boolean>;
  respondToInvitation: (accept: boolean) => Promise<boolean>;
  
  // State
  invitationStatus: InvitationStatus;
  requestStatus: RequestStatus;
  currentInvitation: GuestInvitation | null;
  isCoHost: boolean;
  canPublish: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useGuestInvitation(options: UseGuestInvitationOptions): UseGuestInvitationResult {
  const {
    sessionId,
    isHost,
    onInvitationReceived,
    onRequestReceived,
    onBecameCoHost,
    onGuestEnded,
  } = options;

  const { user } = useAuth();
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>('idle');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [currentInvitation, setCurrentInvitation] = useState<GuestInvitation | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [isCoHost, setIsCoHost] = useState(false);
  const [canPublish, setCanPublish] = useState(isHost);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const currentRequestId = useRef<string | null>(null);

  // Realtime subscription for invitation events
  useEffect(() => {
    if (!user?.id || !sessionId) return;

    // User channel - davet bildirimleri
    const userChannel = supabase
      .channel(`user:${user.id}`)
      .on('broadcast', { event: 'guest_invitation' }, (payload) => {
        const invitation: GuestInvitation = payload.payload;
        setCurrentInvitation(invitation);
        setInvitationStatus('pending');
        onInvitationReceived?.(invitation);
      })
      .on('broadcast', { event: 'join_request_response' }, (payload) => {
        if (payload.payload.approved) {
          setRequestStatus('approved');
          setIsCoHost(true);
          setCanPublish(true);
          onBecameCoHost?.();
        } else {
          setRequestStatus('rejected');
        }
      })
      .on('broadcast', { event: 'your_guest_ended' }, () => {
        setIsCoHost(false);
        setCanPublish(false);
        onGuestEnded?.();
      })
      .subscribe();

    // Host channel - talep bildirimleri (sadece host için)
    let hostChannel: ReturnType<typeof supabase.channel> | null = null;
    
    if (isHost) {
      hostChannel = supabase
        .channel(`session:${sessionId}:host`)
        .on('broadcast', { event: 'join_request' }, (payload) => {
          const request: JoinRequest = {
            id: payload.payload.requestId,
            userId: payload.payload.userId,
            userName: payload.payload.userName,
            userAvatar: payload.payload.userAvatar,
            message: payload.payload.message,
            expiresAt: payload.payload.expiresAt,
          };
          setPendingRequests((prev) => [...prev, request]);
          onRequestReceived?.(request);
        })
        .on('broadcast', { event: 'invitation_rejected' }, (payload) => {
          // Davet reddedildi bildirimi
          console.log('Invitation rejected by:', payload.payload.userName);
        })
        .subscribe();
    }

    return () => {
      userChannel.unsubscribe();
      hostChannel?.unsubscribe();
    };
  }, [user?.id, sessionId, isHost, onInvitationReceived, onRequestReceived, onBecameCoHost, onGuestEnded]);

  // Host: Konuk davet et
  const inviteGuest = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!isHost) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('invite-guest', {
        body: { sessionId, targetUserId },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Davet gönderilemedi');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isHost]);

  // Host: Talebe yanıt ver
  const respondToRequest = useCallback(async (requestId: string, approve: boolean): Promise<boolean> => {
    if (!isHost) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('respond-join-request', {
        body: { requestId, approve },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      // Talebi listeden kaldır
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Yanıt gönderilemedi');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isHost]);

  // Host: Konuğu sonlandır
  const endGuest = useCallback(async (guestUserId: string): Promise<boolean> => {
    if (!isHost) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('end-guest', {
        body: { sessionId, guestUserId },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Konuk sonlandırılamadı');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isHost]);

  // Viewer: Katılma talebi gönder
  const requestToJoin = useCallback(async (message?: string): Promise<boolean> => {
    if (isHost || requestStatus === 'pending') return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('request-to-join', {
        body: { sessionId, message },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      currentRequestId.current = data.request.id;
      setRequestStatus('pending');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Talep gönderilemedi');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isHost, requestStatus]);

  // Viewer: Talebi iptal et
  const cancelRequest = useCallback(async (): Promise<boolean> => {
    if (!currentRequestId.current || requestStatus !== 'pending') return false;
    
    // Basit cancel - DB güncelleme yapılabilir
    setRequestStatus('cancelled');
    currentRequestId.current = null;
    return true;
  }, [requestStatus]);

  // Viewer: Davete yanıt ver
  const respondToInvitation = useCallback(async (accept: boolean): Promise<boolean> => {
    if (invitationStatus !== 'pending' || !currentInvitation) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('respond-guest-invitation', {
        body: { sessionId: currentInvitation.sessionId, accept },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      if (accept && data.accepted) {
        setInvitationStatus('accepted');
        setIsCoHost(true);
        setCanPublish(true);
        onBecameCoHost?.();
      } else {
        setInvitationStatus('rejected');
      }

      setCurrentInvitation(null);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Yanıt gönderilemedi');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [invitationStatus, currentInvitation, onBecameCoHost]);

  return {
    // Host actions
    inviteGuest,
    respondToRequest,
    endGuest,
    pendingRequests,
    
    // Viewer actions
    requestToJoin,
    cancelRequest,
    respondToInvitation,
    
    // State
    invitationStatus,
    requestStatus,
    currentInvitation,
    isCoHost,
    canPublish,
    isLoading,
    error,
  };
}
