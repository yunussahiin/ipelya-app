/**
 * Report Hook
 * Canlı yayında kullanıcı şikayeti gönderme
 * Doğrudan Supabase'e insert yapar (RLS policy ile korumalı)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'nudity'
  | 'violence'
  | 'hate_speech'
  | 'scam'
  | 'underage'
  | 'copyright'
  | 'other';

export interface ReportReasonOption {
  value: ReportReason;
  label: string;
  icon: string;
}

export const REPORT_REASONS: ReportReasonOption[] = [
  { value: 'harassment', label: 'Taciz', icon: 'warning' },
  { value: 'spam', label: 'Spam', icon: 'mail-unread' },
  { value: 'nudity', label: 'Uygunsuz İçerik', icon: 'eye-off' },
  { value: 'violence', label: 'Şiddet', icon: 'alert-circle' },
  { value: 'hate_speech', label: 'Nefret Söylemi', icon: 'megaphone' },
  { value: 'scam', label: 'Dolandırıcılık', icon: 'cash' },
  { value: 'underage', label: 'Yaş Sınırı İhlali', icon: 'person' },
  { value: 'copyright', label: 'Telif Hakkı', icon: 'document-text' },
  { value: 'other', label: 'Diğer', icon: 'ellipsis-horizontal' },
];

export interface ReportData {
  sessionId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
}

export interface ReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

export interface UseReportResult {
  /** Şikayet gönderiliyor mu? */
  isSubmitting: boolean;
  /** Son şikayet başarılı mı? */
  lastSubmitSuccess: boolean | null;
  /** Şikayet gönder */
  submitReport: (data: ReportData) => Promise<ReportResult>;
  /** State'i temizle */
  reset: () => void;
}

/**
 * Kullanıcı şikayeti gönderme hook'u
 * 
 * @example
 * ```tsx
 * const { submitReport, isSubmitting } = useReport();
 * 
 * const handleReport = async () => {
 *   const result = await submitReport({
 *     sessionId: session.id,
 *     reportedUserId: participant.id,
 *     reason: 'harassment',
 *     description: 'Küfürlü konuşuyor',
 *   });
 *   
 *   if (result.success) {
 *     showToast({ message: 'Şikayetiniz alındı' });
 *   }
 * };
 * ```
 */
export function useReport(): UseReportResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitSuccess, setLastSubmitSuccess] = useState<boolean | null>(null);

  const submitReport = useCallback(async (data: ReportData): Promise<ReportResult> => {
    setIsSubmitting(true);
    setLastSubmitSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Oturum açmanız gerekiyor' };
      }

      // Şikayeti gönder
      const { data: report, error } = await supabase
        .from('live_reports')
        .insert({
          session_id: data.sessionId,
          reporter_id: user.id,
          reported_user_id: data.reportedUserId,
          reason: data.reason,
          description: data.description,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Report submit error', error, { tag: 'Report' });
        setLastSubmitSuccess(false);
        return { success: false, error: error.message };
      }

      setLastSubmitSuccess(true);
      return { success: true, reportId: report.id };
    } catch (error) {
      logger.error('Report unexpected error', error, { tag: 'Report' });
      setLastSubmitSuccess(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setLastSubmitSuccess(null);
  }, []);

  return {
    isSubmitting,
    lastSubmitSuccess,
    submitReport,
    reset,
  };
}

/**
 * Şikayet nedeni label'ını döndürür
 */
export function getReportReasonLabel(reason: ReportReason): string {
  const option = REPORT_REASONS.find(r => r.value === reason);
  return option?.label || reason;
}
