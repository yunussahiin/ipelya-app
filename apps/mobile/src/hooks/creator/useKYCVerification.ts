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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      const timestamp = Date.now();
      const extension = localUri.split('.').pop() || 'jpg';
      const fileName = `${type}-${timestamp}.${extension}`;
      const storagePath = `kyc/${session.user.id}/${fileName}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(storagePath, decode(base64), {
          contentType: `image/${extension}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      return storagePath;
    } catch (err: any) {
      console.error('[useKYCVerification] Upload error:', err);
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
    setError(null);
  };

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
    // Actions
    setFormData,
    setDocumentPhoto,
    submitApplication,
    goToStep,
    nextStep,
    prevStep,
    reset,
    refresh: loadStatus,
  };
}

// Helper: Base64 decode for upload
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
