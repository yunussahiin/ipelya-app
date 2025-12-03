/**
 * useKYCVerification Hook
 * KYC doğrulama süreci yönetimi
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { File } from 'expo-file-system';

export type KYCLevel = 'basic' | 'full';
export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface KYCProfile {
  status: KYCStatus;
  level: KYCLevel | null;
  verifiedName: string | null;
  monthlyPayoutLimit: number | null;
  verifiedAt: string | null;
  pendingApplication: {
    id: string;
    level: KYCLevel;
    submittedAt: string;
  } | null;
  lastRejection: {
    reason: string;
    rejectedAt: string;
  } | null;
}

export interface KYCFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  idNumber?: string;
}

export interface OCRData {
  tcNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}

export interface KYCDocumentPaths {
  idFrontPath: string | null;
  idBackPath: string | null;
  selfiePath: string | null;
}

export type KYCStep = 'form' | 'id-front' | 'id-back' | 'selfie' | 'review' | 'result';

export function useKYCVerification() {
  const [profile, setProfile] = useState<KYCProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<KYCStep>('form');
  const [formData, setFormData] = useState<KYCFormData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    idNumber: ''
  });
  const [documentPaths, setDocumentPaths] = useState<KYCDocumentPaths>({
    idFrontPath: null,
    idBackPath: null,
    selfiePath: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // OCR data (kimlik okuma sonuçları)
  const [ocrData, setOcrDataState] = useState<OCRData | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-kyc-status');
      if (fnError) throw fnError;
      setProfile(data);
    } catch (err: any) {
      console.error('[useKYCVerification] Load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const uploadDocument = async (localUri: string, type: 'id-front' | 'id-back' | 'selfie', captureTime?: Date): Promise<string | null> => {
    console.log(`[KYC Upload] Starting upload for ${type}`, { localUri });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error('[KYC Upload] Not authenticated');
        throw new Error('Not authenticated');
      }
      console.log('[KYC Upload] User authenticated:', session.user.id);

      // Tarih damgası - dosya adına ekle
      const now = captureTime || new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2024-12-03T04-39-00
      const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${type}_${dateStr}.${extension}`;
      const storagePath = `kyc/${session.user.id}/${fileName}`;
      console.log('[KYC Upload] Storage path:', storagePath);

      // MIME type - jpg -> jpeg
      const mimeType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
      console.log('[KYC Upload] MIME type:', mimeType);

      // Fix double file:// prefix if present
      let cleanUri = localUri;
      if (localUri.startsWith('file://file://')) {
        cleanUri = localUri.replace('file://file://', 'file://');
      }
      console.log('[KYC Upload] Clean URI:', cleanUri);

      // New FileSystem API - read file as bytes directly
      console.log('[KYC Upload] Reading file bytes...');
      const file = new File(cleanUri);
      const bytes = await file.bytes();
      console.log('[KYC Upload] Bytes length:', bytes.length);

      // Upload to Supabase Storage
      console.log('[KYC Upload] Uploading to Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(storagePath, bytes, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('[KYC Upload] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[KYC Upload] Upload successful:', storagePath);
      return storagePath;
    } catch (err: any) {
      console.error('[KYC Upload] Error:', err.message, err);
      throw err;
    }
  };

  const setDocumentPhoto = async (localUri: string, type: 'id-front' | 'id-back' | 'selfie', captureTime?: Date) => {
    try {
      const path = await uploadDocument(localUri, type, captureTime);
      
      setDocumentPaths(prev => ({
        ...prev,
        [`${type.replace('-', '')}Path`]: path,
        [type === 'id-front' ? 'idFrontPath' : type === 'id-back' ? 'idBackPath' : 'selfiePath']: path
      }));
      
      return { success: true, path };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const submitApplication = async (level: KYCLevel = 'basic') => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate all required data
      if (!formData.firstName || !formData.lastName || !formData.birthDate) {
        throw new Error('Lütfen tüm kişisel bilgileri doldurun');
      }
      
      if (!documentPaths.idFrontPath || !documentPaths.idBackPath || !documentPaths.selfiePath) {
        throw new Error('Lütfen tüm belgeleri yükleyin');
      }

      const { data, error: fnError } = await supabase.functions.invoke('submit-kyc-application', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthDate: formData.birthDate,
          idNumber: formData.idNumber,
          idFrontPath: documentPaths.idFrontPath,
          idBackPath: documentPaths.idBackPath,
          selfiePath: documentPaths.selfiePath,
          level
        }
      });

      if (fnError) throw fnError;

      await loadStatus();
      setCurrentStep('result');
      
      return { success: true, application: data.application };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToStep = (step: KYCStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const steps: KYCStep[] = ['form', 'id-front', 'id-back', 'selfie', 'review', 'result'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: KYCStep[] = ['form', 'id-front', 'id-back', 'selfie', 'review', 'result'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const reset = () => {
    setCurrentStep('form');
    setFormData({ firstName: '', lastName: '', birthDate: '', idNumber: '' });
    setDocumentPaths({ idFrontPath: null, idBackPath: null, selfiePath: null });
    setOcrDataState(null);
    setError(null);
  };

  /**
   * OCR verilerini kaydet ve form'u otomatik doldur
   */
  const setOCRData = useCallback((data: OCRData) => {
    setOcrDataState(data);
    
    // Form'u OCR verileriyle güncelle (sadece boş alanları)
    setFormData(prev => ({
      firstName: prev.firstName || data.firstName || '',
      lastName: prev.lastName || data.lastName || '',
      birthDate: prev.birthDate || data.birthDate || '',
      idNumber: prev.idNumber || data.tcNumber || ''
    }));
  }, []);

  /**
   * OCR ile form verileri eşleşiyor mu kontrol et
   */
  const validateOCRMatch = useCallback((): { matches: boolean; mismatches: string[] } => {
    if (!ocrData) return { matches: true, mismatches: [] };

    const mismatches: string[] = [];
    const normalize = (str?: string) => str?.toLowerCase().trim() || '';

    if (ocrData.firstName && formData.firstName && 
        normalize(ocrData.firstName) !== normalize(formData.firstName)) {
      mismatches.push('Ad');
    }

    if (ocrData.lastName && formData.lastName && 
        normalize(ocrData.lastName) !== normalize(formData.lastName)) {
      mismatches.push('Soyad');
    }

    if (ocrData.tcNumber && formData.idNumber && 
        ocrData.tcNumber !== formData.idNumber) {
      mismatches.push('TC Kimlik No');
    }

    return {
      matches: mismatches.length === 0,
      mismatches
    };
  }, [ocrData, formData]);

  const canSubmit = !!(
    formData.firstName &&
    formData.lastName &&
    formData.birthDate &&
    documentPaths.idFrontPath &&
    documentPaths.idBackPath &&
    documentPaths.selfiePath
  );

  return {
    profile,
    isLoading,
    isSubmitting,
    error,
    // Wizard
    currentStep,
    formData,
    documentPaths,
    uploadProgress,
    canSubmit,
    // OCR
    ocrData,
    // Actions
    setFormData,
    setDocumentPhoto,
    setOCRData,
    validateOCRMatch,
    submitApplication,
    goToStep,
    nextStep,
    prevStep,
    reset,
    refresh: loadStatus,
  };
}

