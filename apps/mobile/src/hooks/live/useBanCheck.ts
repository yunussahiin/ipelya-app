/**
 * Ban Check Hook
 * Yayına katılmadan önce kullanıcının ban durumunu kontrol eder
 * Web Ops Dashboard'dan yapılan kick/ban işlemleri ile entegre çalışır
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type BanType = 'session' | 'creator' | 'global';

export interface BanInfo {
  id: string;
  sessionId?: string;
  bannedBy?: string;
  banType: BanType;
  reason?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface UseBanCheckResult {
  /** Kullanıcı banlı mı? */
  isBanned: boolean;
  /** Ban bilgisi */
  banInfo: BanInfo | null;
  /** Kontrol yapılıyor mu? */
  isChecking: boolean;
  /** Ban kontrolü yap */
  checkBan: (sessionId: string, creatorId?: string) => Promise<boolean>;
  /** Ban bilgisini temizle */
  clearBanInfo: () => void;
}

/**
 * Kullanıcının ban durumunu kontrol eden hook
 * 
 * @example
 * ```tsx
 * const { isBanned, banInfo, checkBan } = useBanCheck();
 * 
 * // Yayına katılmadan önce kontrol et
 * const handleJoin = async () => {
 *   const banned = await checkBan(sessionId, creatorId);
 *   if (banned) {
 *     Alert.alert('Yasaklandınız', banInfo?.reason || 'Bu yayına katılamazsınız');
 *     return;
 *   }
 *   // Yayına katıl...
 * };
 * ```
 */
export function useBanCheck(): UseBanCheckResult {
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBan = useCallback(async (sessionId: string, creatorId?: string): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[BanCheck] No user found');
        return false;
      }

      console.log('[BanCheck] Checking ban for user:', user.id, 'session:', sessionId);

      // Ban kontrolü - session, creator veya global
      // 1. Session ban: Bu spesifik yayından yasaklanmış
      // 2. Creator ban: Bu yayıncının tüm yayınlarından yasaklanmış
      // 3. Global ban: Tüm yayınlardan yasaklanmış

      const { data: bans, error } = await supabase
        .from('live_session_bans')
        .select('id, session_id, banned_by, ban_type, reason, expires_at, created_at')
        .eq('banned_user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('[BanCheck] Error fetching bans:', error);
        return false;
      }

      if (!bans || bans.length === 0) {
        console.log('[BanCheck] No active bans found');
        setIsBanned(false);
        setBanInfo(null);
        return false;
      }

      // Şimdi ban'ları filtrele
      const now = new Date();
      const activeBan = bans.find(ban => {
        // Süresi dolmuş mu kontrol et
        if (ban.expires_at && new Date(ban.expires_at) < now) {
          return false;
        }

        // Ban tiplerine göre kontrol
        if (ban.ban_type === 'global') {
          // Global ban - tüm yayınlarda geçerli
          return true;
        }

        if (ban.ban_type === 'creator' && creatorId && ban.banned_by === creatorId) {
          // Creator ban - bu yayıncının tüm yayınlarında geçerli
          return true;
        }

        if (ban.ban_type === 'session' && ban.session_id === sessionId) {
          // Session ban - sadece bu yayında geçerli
          return true;
        }

        return false;
      });

      if (activeBan) {
        console.log('[BanCheck] Active ban found:', activeBan);
        setIsBanned(true);
        setBanInfo({
          id: activeBan.id,
          sessionId: activeBan.session_id,
          bannedBy: activeBan.banned_by,
          banType: activeBan.ban_type as BanType,
          reason: activeBan.reason,
          expiresAt: activeBan.expires_at,
          createdAt: activeBan.created_at,
        });
        return true;
      }

      console.log('[BanCheck] No matching ban found');
      setIsBanned(false);
      setBanInfo(null);
      return false;
    } catch (error) {
      console.error('[BanCheck] Unexpected error:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearBanInfo = useCallback(() => {
    setIsBanned(false);
    setBanInfo(null);
  }, []);

  return {
    isBanned,
    banInfo,
    isChecking,
    checkBan,
    clearBanInfo,
  };
}

/**
 * Ban tipine göre kullanıcıya gösterilecek mesajı döndürür
 */
export function getBanMessage(banInfo: BanInfo): { title: string; message: string } {
  const expiresText = banInfo.expiresAt
    ? `\n\nYasak ${new Date(banInfo.expiresAt).toLocaleDateString('tr-TR')} tarihinde kalkacak.`
    : '\n\nBu yasak kalıcıdır.';

  const reasonText = banInfo.reason ? `\n\nNeden: ${banInfo.reason}` : '';

  switch (banInfo.banType) {
    case 'global':
      return {
        title: '🚫 Platform Yasağı',
        message: `Tüm canlı yayınlara katılmanız engellenmiştir.${reasonText}${expiresText}`,
      };
    case 'creator':
      return {
        title: '🚫 Yayıncı Yasağı',
        message: `Bu yayıncının yayınlarına katılmanız engellenmiştir.${reasonText}${expiresText}`,
      };
    case 'session':
    default:
      return {
        title: '🚫 Yayın Yasağı',
        message: `Bu yayına katılmanız engellenmiştir.${reasonText}`,
      };
  }
}
