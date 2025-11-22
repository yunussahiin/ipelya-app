/**
 * useSessionTimeout Hook
 * 
 * Manages session timeout and auto-refresh
 * - 30-minute inactivity timeout
 * - Activity tracking
 * - Warning before timeout (5 min)
 * - Auto-refresh on activity
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useShadowStore } from '@/store/shadow.store';
import { updateSessionActivity, checkSessionTimeout } from '@/services/session.service';
import { Alert } from 'react-native';

const TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 5;
const CHECK_INTERVAL_MS = 60000; // Check every minute

export function useSessionTimeout() {
  const enabled = useShadowStore((state) => state.enabled);
  const sessionId = useShadowStore((state) => state.sessionId);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef<Date>(new Date());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Update last activity timestamp
   */
  const updateActivity = async () => {
    if (!enabled || !sessionId) return;

    lastActivityRef.current = new Date();
    
    // Update session activity in database
    await updateSessionActivity(sessionId);
    
    // Clear warning if shown
    if (showWarning) {
      setShowWarning(false);
    }
  };

  /**
   * Check if session has timed out
   */
  const checkTimeout = async () => {
    if (!enabled || !sessionId) return;

    const now = new Date();
    const lastActivity = lastActivityRef.current;
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / 60000;

    // Check if session expired in database
    const isExpired = await checkSessionTimeout(sessionId, TIMEOUT_MINUTES);
    
    if (isExpired) {
      console.log('⏰ Session timed out');
      
      // Disable shadow mode
      useShadowStore.setState({ enabled: false, sessionId: null });
      
      // Show alert
      Alert.alert(
        '⏰ Oturum Zaman Aşımı',
        'Shadow profil oturumunuz 30 dakika inaktif kaldığı için sonlandırıldı.',
        [{ text: 'Tamam' }]
      );
      
      return;
    }

    // Show warning if close to timeout
    if (minutesSinceActivity >= (TIMEOUT_MINUTES - WARNING_MINUTES) && !showWarning) {
      setShowWarning(true);
      
      Alert.alert(
        '⚠️ Oturum Uyarısı',
        `Shadow profil oturumunuz ${WARNING_MINUTES} dakika içinde sonlanacak. Devam etmek için bir işlem yapın.`,
        [
          {
            text: 'Devam Et',
            onPress: updateActivity,
          },
        ]
      );
    }
  };

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App came to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App came to foreground, checking session...');
        checkTimeout();
      }

      // App went to background
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('📱 App went to background');
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, sessionId]);

  /**
   * Start timeout checker
   */
  useEffect(() => {
    if (!enabled || !sessionId) {
      // Clear interval if shadow mode disabled
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = undefined;
      }
      return;
    }

    console.log('⏰ Starting session timeout checker...');
    
    // Reset activity on mount
    updateActivity();

    // Check timeout periodically
    checkIntervalRef.current = setInterval(checkTimeout, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, sessionId]);

  return {
    updateActivity,
    showWarning,
  };
}
