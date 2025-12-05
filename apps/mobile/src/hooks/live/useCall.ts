/**
 * Call Hook
 * 1-1 arama yönetimi
 * State machine: idle -> ringing -> connected -> ended
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export type CallState = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed';
export type CallType = 'video' | 'audio';
export type CallEndReason = 'completed' | 'declined' | 'missed' | 'busy' | 'failed' | 'cancelled';

export interface Call {
  id: string;
  roomName: string;
  callerId: string;
  calleeId: string;
  callerName?: string;
  callerAvatar?: string;
  calleeName?: string;
  calleeAvatar?: string;
  callType: CallType;
  status: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
}

export interface UseCallOptions {
  onIncomingCall?: (call: Call) => void;
  onCallEnded?: (reason: CallEndReason) => void;
  onCallConnected?: () => void;
}

export interface UseCallResult {
  // State
  call: Call | null;
  callState: CallState;
  isIncoming: boolean;
  isCaller: boolean;
  error: Error | null;
  
  // Actions
  initiateCall: (calleeId: string, callType: CallType) => Promise<Call | null>;
  acceptCall: (callId: string) => Promise<boolean>;
  declineCall: (callId: string) => Promise<boolean>;
  endCall: () => Promise<boolean>;
  cancelCall: () => Promise<boolean>;
}

export function useCall(options?: UseCallOptions): UseCallResult {
  const { onIncomingCall, onCallEnded, onCallConnected } = options || {};
  const { user } = useAuth();

  const [call, setCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isIncoming, setIsIncoming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Is current user the caller?
  const isCaller = call ? call.callerId === user?.id : false;

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`calls:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const newCall = payload.new as Call;
          
          if (newCall.status === 'ringing') {
            // Get caller info
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newCall.callerId)
              .eq('type', 'real')
              .single();

            const incomingCall: Call = {
              ...newCall,
              callerName: callerProfile?.display_name,
              callerAvatar: callerProfile?.avatar_url,
            };

            setCall(incomingCall);
            setCallState('ringing');
            setIsIncoming(true);
            onIncomingCall?.(incomingCall);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
        },
        (payload) => {
          const updated = payload.new as Call;
          
          if (call?.id !== updated.id) return;

          if (updated.status === 'connected') {
            setCallState('connected');
            setCall(updated);
            onCallConnected?.();
          } else if (updated.status === 'ended') {
            setCallState('ended');
            setCall(null);
            onCallEnded?.(updated.duration ? 'completed' : 'cancelled');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, call?.id, onIncomingCall, onCallConnected, onCallEnded]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, []);

  // Initiate a call
  const initiateCall = useCallback(async (calleeId: string, callType: CallType): Promise<Call | null> => {
    if (!user?.id || callState !== 'idle') return null;

    setCallState('initiating');
    setError(null);
    setIsIncoming(false);

    try {
      // Get callee info
      const { data: calleeProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', calleeId)
        .eq('type', 'real')
        .single();

      // Create call via edge function
      const { data, error: fnError } = await supabase.functions.invoke('create-call', {
        body: { calleeId, callType },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      const newCall: Call = {
        ...data.call,
        calleeName: calleeProfile?.display_name,
        calleeAvatar: calleeProfile?.avatar_url,
      };

      setCall(newCall);
      setCallState('ringing');

      // Set timeout for unanswered call (60 seconds)
      callTimeoutRef.current = setTimeout(() => {
        if (callState === 'ringing') {
          cancelCall();
        }
      }, 60000);

      return newCall;
    } catch (err) {
      setCallState('failed');
      setError(err instanceof Error ? err : new Error('Arama başlatılamadı'));
      return null;
    }
  }, [user?.id, callState]);

  // Accept incoming call
  const acceptCall = useCallback(async (callId: string): Promise<boolean> => {
    if (callState !== 'ringing' || !isIncoming) return false;

    setCallState('connecting');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('accept-call', {
        body: { callId },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error);

      setCallState('connected');
      onCallConnected?.();
      return true;
    } catch (err) {
      setCallState('failed');
      setError(err instanceof Error ? err : new Error('Arama kabul edilemedi'));
      return false;
    }
  }, [callState, isIncoming, onCallConnected]);

  // Decline incoming call
  const declineCall = useCallback(async (callId: string): Promise<boolean> => {
    if (callState !== 'ringing' || !isIncoming) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('decline-call', {
        body: { callId },
      });

      if (fnError) throw new Error(fnError.message);

      setCall(null);
      setCallState('idle');
      onCallEnded?.('declined');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Arama reddedilemedi'));
      return false;
    }
  }, [callState, isIncoming, onCallEnded]);

  // End active call
  const endCall = useCallback(async (): Promise<boolean> => {
    if (!call || callState !== 'connected') return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('end-call', {
        body: { callId: call.id },
      });

      if (fnError) throw new Error(fnError.message);

      setCall(null);
      setCallState('idle');
      onCallEnded?.('completed');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Arama sonlandırılamadı'));
      return false;
    }
  }, [call, callState, onCallEnded]);

  // Cancel outgoing call
  const cancelCall = useCallback(async (): Promise<boolean> => {
    if (!call || callState !== 'ringing' || isIncoming) return false;

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('cancel-call', {
        body: { callId: call.id },
      });

      if (fnError) throw new Error(fnError.message);

      setCall(null);
      setCallState('idle');
      onCallEnded?.('cancelled');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Arama iptal edilemedi'));
      return false;
    }
  }, [call, callState, isIncoming, onCallEnded]);

  return {
    call,
    callState,
    isIncoming,
    isCaller,
    error,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    cancelCall,
  };
}
