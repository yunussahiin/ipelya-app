/**
 * useKYCVerification Hook
 * KYC doğrulama süreci yönetimi
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as FileSystem from 'expo-file-system';

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

  const uploadDocument = async (localUri: string, type: 'id-front' | 'id-back' | 'selfie'): Promise<string | null> => {
    console.log(`[KYC Upload] Starting upload for ${type}`, { localUri });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error('[KYC Upload] Not authenticated');
        throw new Error('Not authenticated');
      }
      console.log('[KYC Upload] User authenticated:', session.user.id);

      const timestamp = Date.now();
      const extension = localUri.split('.').pop() || 'jpg';
      const fileName = `${type}-${timestamp}.${extension}`;
      const storagePath = `kyc/${session.user.id}/${fileName}`;
      console.log('[KYC Upload] Storage path:', storagePath);

      // Fix double file:// prefix if present
      let cleanUri = localUri;
      if (localUri.startsWith('file://file://')) {
        cleanUri = localUri.replace('file://file://', 'file://');
      }
      console.log('[KYC Upload] Clean URI:', cleanUri);

      // Read file as base64
      console.log('[KYC Upload] Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(cleanUri, {
        encoding: 'base64' as any // Workaround for EncodingType issue
      });
      console.log('[KYC Upload] Base64 length:', base64.length);

      // Convert base64 to Uint8Array
      console.log('[KYC Upload] Converting to Uint8Array...');
      const bytes = decodeBase64ToBytes(base64);
      console.log('[KYC Upload] Bytes length:', bytes.length);

      // Upload to Supabase Storage
      console.log('[KYC Upload] Uploading to Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(storagePath, bytes, {
          contentType: `image/${extension}`,
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

  const setDocumentPhoto = async (localUri: string, type: 'id-front' | 'id-back' | 'selfie') => {
    try {
      const path = await uploadDocument(localUri, type);
      
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

/**
 * Base64 string'i Uint8Array'e çevir
 * React Native'de atob() yok, bu yüzden manuel decode yapıyoruz
 */
function decodeBase64ToBytes(base64: string): Uint8Array {
  // Base64 karakterlerini binary'ye çevir
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  // Padding karakterlerini kaldır
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}
