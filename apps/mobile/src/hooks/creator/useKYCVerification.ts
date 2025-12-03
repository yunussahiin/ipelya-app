/**
 * useKYCVerification Hook
 * KYC doğrulama süreci yönetimi
 * 
 * Özellikler:
 * - Aşama kaydetme (AsyncStorage)
 * - Kullanıcı çıkıp girdiğinde kaldığı yerden devam
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KYC_STORAGE_KEY = 'kyc_wizard_state';

export type KYCLevel = 'basic' | 'full';
export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface KYCLimits {
  basic: number;
  full: number;
}

export interface KYCCooldown {
  enabled: boolean;
  days: number;
  until: string | null;
}

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
  // Yeni: Mobile için ayarlar
  canApply: boolean;
  limits: KYCLimits;
  cooldown: KYCCooldown;
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
  confidence?: number; // 0-1 arası OCR güven skoru
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
  const [isRestored, setIsRestored] = useState(false);
  
  // OCR data (kimlik okuma sonuçları)
  const [ocrData, setOcrDataState] = useState<OCRData | null>(null);
  
  // Face detection sonucu (selfie ekranından)
  const [faceDetectionPassed, setFaceDetectionPassed] = useState<boolean>(false);
  
  // Liveness frames (canlılık kontrolü sonuçları)
  const [livenessFrames, setLivenessFrames] = useState<any[]>([]);

  // Wizard state'ini AsyncStorage'a kaydet
  const saveWizardState = useCallback(async () => {
    try {
      const state = {
        currentStep,
        formData,
        documentPaths,
        ocrData,
        savedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(state));
      console.log('[KYC] Wizard state saved:', currentStep);
    } catch (e) {
      console.warn('[KYC] Failed to save wizard state:', e);
    }
  }, [currentStep, formData, documentPaths, ocrData]);

  // Wizard state'ini AsyncStorage'dan yükle
  const restoreWizardState = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(KYC_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        
        // 24 saatten eski ise temizle
        const savedAt = new Date(state.savedAt);
        const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSave > 24) {
          console.log('[KYC] Saved state expired, clearing');
          await AsyncStorage.removeItem(KYC_STORAGE_KEY);
          return;
        }
        
        console.log('[KYC] Restoring wizard state:', state.currentStep);
        
        if (state.formData) setFormData(state.formData);
        if (state.documentPaths) setDocumentPaths(state.documentPaths);
        if (state.ocrData) setOcrDataState(state.ocrData);
        if (state.currentStep && state.currentStep !== 'result') {
          setCurrentStep(state.currentStep);
        }
      }
    } catch (e) {
      console.warn('[KYC] Failed to restore wizard state:', e);
    } finally {
      setIsRestored(true);
    }
  }, []);

  // State değiştiğinde kaydet
  useEffect(() => {
    if (isRestored && currentStep !== 'result') {
      saveWizardState();
    }
  }, [isRestored, currentStep, formData, documentPaths, ocrData, saveWizardState]);

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
    restoreWizardState();
  }, [loadStatus, restoreWizardState]);

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

  // Eski fotoğrafı bucket'tan sil
  const deleteDocument = async (type: 'id-front' | 'id-back' | 'selfie'): Promise<boolean> => {
    const pathKey = type === 'id-front' ? 'idFrontPath' : type === 'id-back' ? 'idBackPath' : 'selfiePath';
    const currentPath = documentPaths[pathKey];
    
    if (!currentPath) return true; // Silinecek dosya yok
    
    try {
      console.log(`[KYC Delete] Deleting ${type}:`, currentPath);
      const { error } = await supabase.storage
        .from('kyc-documents')
        .remove([currentPath]);
      
      if (error) {
        console.warn(`[KYC Delete] Error deleting ${type}:`, error);
        return false;
      }
      
      console.log(`[KYC Delete] Successfully deleted ${type}`);
      
      // State'i temizle
      setDocumentPaths(prev => ({
        ...prev,
        [pathKey]: null
      }));
      
      return true;
    } catch (err: any) {
      console.error(`[KYC Delete] Error:`, err);
      return false;
    }
  };

  const setDocumentPhoto = async (localUri: string, type: 'id-front' | 'id-back' | 'selfie', captureTime?: Date) => {
    try {
      // Önce eski fotoğrafı sil (varsa)
      await deleteDocument(type);
      
      const path = await uploadDocument(localUri, type, captureTime);
      
      setDocumentPaths(prev => ({
        ...prev,
        [`${type.replace('-', '')}Path`]: path,
        [type === 'id-front' ? 'idFrontPath' : type === 'id-back' ? 'idBackPath' : 'selfiePath']: path
      }));
      
      // currentStep'i de güncelle - hangi aşamadayız
      const stepMap: Record<string, KYCStep> = {
        'id-front': 'id-back',  // id-front çekildiyse sonraki adım id-back
        'id-back': 'selfie',    // id-back çekildiyse sonraki adım selfie
        'selfie': 'selfie'      // selfie çekildiyse aynı kalır (son adım)
      };
      setCurrentStep(stepMap[type]);
      
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
          level,
          // OCR verilerini ekle
          ocrData: ocrData ? {
            tc_number: ocrData.tcNumber,
            first_name: ocrData.firstName,
            last_name: ocrData.lastName,
            birth_date: ocrData.birthDate,
            // Confidence string'den number'a çevir ("95%" -> 0.95)
            confidence_score: ocrData.confidence && typeof ocrData.confidence === 'string'
              ? parseFloat(ocrData.confidence.replace('%', '')) / 100 
              : (typeof ocrData.confidence === 'number' ? ocrData.confidence : 0)
          } : null,
          // Face detection sonucunu ekle
          faceDetectionPassed,
          // Liveness frames (canlılık kontrolü)
          livenessFrames: livenessFrames.length > 0 ? livenessFrames : null
        }
      });

      if (fnError) throw fnError;

      // Başvuru başarılı - wizard state'i temizle
      try {
        await AsyncStorage.removeItem(KYC_STORAGE_KEY);
        console.log('[KYC] Application submitted, wizard state cleared');
      } catch (e) {
        // Ignore
      }

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

  const reset = async () => {
    setCurrentStep('form');
    setFormData({ firstName: '', lastName: '', birthDate: '', idNumber: '' });
    setDocumentPaths({ idFrontPath: null, idBackPath: null, selfiePath: null });
    setOcrDataState(null);
    setError(null);
    
    // AsyncStorage'ı da temizle
    try {
      await AsyncStorage.removeItem(KYC_STORAGE_KEY);
      console.log('[KYC] Wizard state cleared');
    } catch (e) {
      console.warn('[KYC] Failed to clear wizard state:', e);
    }
  };

  /**
   * OCR verilerini kaydet ve form'u otomatik doldur
   * Not: Mevcut OCR verileriyle merge eder (arka yüz ön yüzü override etmez)
   */
  const setOCRData = useCallback((data: OCRData) => {
    // Mevcut OCR verileriyle merge et (yeni veri öncelikli, ama undefined olanlar eski değeri korur)
    // Confidence için en yüksek değeri al
    setOcrDataState(prev => ({
      tcNumber: data.tcNumber || prev?.tcNumber,
      firstName: data.firstName || prev?.firstName,
      lastName: data.lastName || prev?.lastName,
      birthDate: data.birthDate || prev?.birthDate,
      confidence: Math.max(data.confidence || 0, prev?.confidence || 0),
    }));
    
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
    // Face detection
    faceDetectionPassed,
    // Liveness
    livenessFrames,
    // Actions
    setFormData,
    setDocumentPhoto,
    deleteDocument,
    setOCRData,
    validateOCRMatch,
    setFaceDetectionPassed,
    setLivenessFrames,
    submitApplication,
    goToStep,
    nextStep,
    prevStep,
    reset,
    refresh: loadStatus,
  };
}

