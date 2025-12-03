/**
 * useLivenessDetection Hook
 * KYC Liveness Check için aktif canlılık kontrolü
 * 
 * 4 Aşamalı Kontrol:
 * 1. Göz kırpma (blink)
 * 2. Gülümseme (smile)
 * 3. Başı sağa çevir (turn right)
 * 4. Başı sola çevir (turn left)
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { 
  useFaceDetector, 
  FaceDetectionOptions, 
  Face 
} from 'react-native-vision-camera-face-detector';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Liveness için optimize edilmiş face detection options
const LIVENESS_FACE_DETECTION_OPTIONS: FaceDetectionOptions = {
  cameraFacing: 'front',
  performanceMode: 'accurate',    // Doğruluk öncelikli
  landmarkMode: 'all',            // Landmark'lar açık
  contourMode: 'none',            // Contour gereksiz
  classificationMode: 'all',      // Gülümseme, göz açık/kapalı
  minFaceSize: 0.25,              // Yüz ekranın %25'i
  trackingEnabled: true,          // Yüz takibi açık
  autoMode: true,
  windowWidth: SCREEN_WIDTH,
  windowHeight: SCREEN_HEIGHT,
};

// Liveness adımları
export type LivenessStep = 'blink' | 'smile' | 'turn_right' | 'turn_left';

export const LIVENESS_STEPS: LivenessStep[] = ['blink', 'smile', 'turn_right', 'turn_left'];

export interface LivenessStepConfig {
  id: LivenessStep;
  title: string;
  instruction: string;
  icon: string;
  successMessage: string;
}

export const LIVENESS_STEP_CONFIGS: Record<LivenessStep, LivenessStepConfig> = {
  blink: {
    id: 'blink',
    title: 'Göz Kırpma',
    instruction: 'Gözlerinizi kırpın',
    icon: 'eye',
    successMessage: 'Harika! Göz kırpma algılandı',
  },
  smile: {
    id: 'smile',
    title: 'Gülümseme',
    instruction: 'Gülümseyin',
    icon: 'smile',
    successMessage: 'Mükemmel! Gülümseme algılandı',
  },
  turn_right: {
    id: 'turn_right',
    title: 'Sağa Çevir',
    instruction: 'Başınızı sağa çevirin',
    icon: 'arrow-right',
    successMessage: 'Süper! Sağa dönüş algılandı',
  },
  turn_left: {
    id: 'turn_left',
    title: 'Sola Çevir',
    instruction: 'Başınızı sola çevirin',
    icon: 'arrow-left',
    successMessage: 'Harika! Sola dönüş algılandı',
  },
};

// Liveness frame verisi (kayıt için)
export interface LivenessFrame {
  timestamp: number;
  step: LivenessStep;
  faceData: {
    yawAngle: number;
    pitchAngle: number;
    rollAngle: number;
    leftEyeOpen: number;
    rightEyeOpen: number;
    smiling: number;
  };
}

// Liveness sonucu
export interface LivenessResult {
  success: boolean;
  completedSteps: LivenessStep[];
  frames: LivenessFrame[];
  totalTime: number;
  score: number;
}

// Hook state
interface LivenessState {
  currentStepIndex: number;
  completedSteps: LivenessStep[];
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  frames: LivenessFrame[];
  startTime: number | null;
}

// Thresholds
const THRESHOLDS = {
  // Göz kırpma
  eyeClosedThreshold: 0.3,    // Göz kapalı sayılır
  eyeOpenThreshold: 0.7,      // Göz açık sayılır
  
  // Gülümseme
  smileThreshold: 0.7,        // Gülümseme algılanır
  smileFrameCount: 10,        // Kaç frame gülümseme gerekli
  
  // Baş çevirme
  turnAngleThreshold: 20,     // Derece cinsinden
  
  // Genel
  stepTimeout: 10000,         // 10 saniye per adım
  minFaceSize: 50,            // Minimum yüz boyutu (pixel)
};

export function useLivenessDetection() {
  const { detectFaces, stopListeners } = useFaceDetector(LIVENESS_FACE_DETECTION_OPTIONS);
  
  const [state, setState] = useState<LivenessState>({
    currentStepIndex: 0,
    completedSteps: [],
    isProcessing: false,
    isComplete: false,
    error: null,
    frames: [],
    startTime: null,
  });
  
  // Refs for detection logic
  const blinkStateRef = useRef<'waiting_close' | 'waiting_open'>('waiting_close');
  const smileCountRef = useRef(0);
  const stepStartTimeRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopListeners();
    };
  }, [stopListeners]);
  
  // Current step
  const currentStep = LIVENESS_STEPS[state.currentStepIndex];
  const currentStepConfig = currentStep ? LIVENESS_STEP_CONFIGS[currentStep] : null;
  
  /**
   * Liveness kontrolünü başlat
   */
  const startLiveness = useCallback(() => {
    setState({
      currentStepIndex: 0,
      completedSteps: [],
      isProcessing: true,
      isComplete: false,
      error: null,
      frames: [],
      startTime: Date.now(),
    });
    blinkStateRef.current = 'waiting_close';
    smileCountRef.current = 0;
    stepStartTimeRef.current = Date.now();
    frameCountRef.current = 0;
  }, []);
  
  /**
   * Liveness kontrolünü durdur
   */
  const stopLiveness = useCallback(() => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
    }));
  }, []);
  
  /**
   * Liveness kontrolünü sıfırla
   */
  const resetLiveness = useCallback(() => {
    setState({
      currentStepIndex: 0,
      completedSteps: [],
      isProcessing: false,
      isComplete: false,
      error: null,
      frames: [],
      startTime: null,
    });
    blinkStateRef.current = 'waiting_close';
    smileCountRef.current = 0;
    stepStartTimeRef.current = null;
    frameCountRef.current = 0;
  }, []);
  
  /**
   * Sonraki adıma geç
   */
  const goToNextStep = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentStepIndex + 1;
      const isComplete = nextIndex >= LIVENESS_STEPS.length;
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset step-specific refs
      blinkStateRef.current = 'waiting_close';
      smileCountRef.current = 0;
      stepStartTimeRef.current = Date.now();
      
      return {
        ...prev,
        currentStepIndex: nextIndex,
        completedSteps: [...prev.completedSteps, LIVENESS_STEPS[prev.currentStepIndex]],
        isComplete,
        isProcessing: !isComplete,
      };
    });
  }, []);
  
  /**
   * Frame'i kaydet
   */
  const recordFrame = useCallback((face: Face, step: LivenessStep) => {
    const frame: LivenessFrame = {
      timestamp: Date.now(),
      step,
      faceData: {
        yawAngle: face.yawAngle,
        pitchAngle: face.pitchAngle,
        rollAngle: face.rollAngle,
        leftEyeOpen: face.leftEyeOpenProbability,
        rightEyeOpen: face.rightEyeOpenProbability,
        smiling: face.smilingProbability,
      },
    };
    
    setState(prev => ({
      ...prev,
      frames: [...prev.frames, frame],
    }));
  }, []);
  
  /**
   * Göz kırpma kontrolü
   */
  const checkBlink = useCallback((face: Face): boolean => {
    const leftEye = face.leftEyeOpenProbability;
    const rightEye = face.rightEyeOpenProbability;
    
    if (blinkStateRef.current === 'waiting_close') {
      // Gözler kapalı mı?
      if (leftEye < THRESHOLDS.eyeClosedThreshold && rightEye < THRESHOLDS.eyeClosedThreshold) {
        blinkStateRef.current = 'waiting_open';
        console.log('[Liveness] Blink: Eyes closed detected');
      }
    } else if (blinkStateRef.current === 'waiting_open') {
      // Gözler tekrar açıldı mı?
      if (leftEye > THRESHOLDS.eyeOpenThreshold && rightEye > THRESHOLDS.eyeOpenThreshold) {
        console.log('[Liveness] Blink: Eyes opened - BLINK DETECTED!');
        return true;
      }
    }
    
    return false;
  }, []);
  
  /**
   * Gülümseme kontrolü
   */
  const checkSmile = useCallback((face: Face): boolean => {
    const smiling = face.smilingProbability;
    
    if (smiling > THRESHOLDS.smileThreshold) {
      smileCountRef.current++;
      console.log(`[Liveness] Smile: ${smileCountRef.current}/${THRESHOLDS.smileFrameCount}`);
      
      if (smileCountRef.current >= THRESHOLDS.smileFrameCount) {
        console.log('[Liveness] Smile: SMILE DETECTED!');
        return true;
      }
    } else {
      // Reset if not smiling
      smileCountRef.current = Math.max(0, smileCountRef.current - 1);
    }
    
    return false;
  }, []);
  
  /**
   * Sağa çevirme kontrolü
   * NOT: Front kamera ayna görüntüsü verir, bu yüzden yaw açısı ters çalışır
   * Kullanıcı sağa çevirince kamera negatif yaw verir
   */
  const checkTurnRight = useCallback((face: Face): boolean => {
    const yaw = face.yawAngle;
    
    // Front kamera ayna: Sağa çevirme = negatif yaw açısı
    if (yaw < -THRESHOLDS.turnAngleThreshold) {
      console.log(`[Liveness] Turn Right: yaw=${yaw.toFixed(1)}° - DETECTED!`);
      return true;
    }
    
    return false;
  }, []);
  
  /**
   * Sola çevirme kontrolü
   * NOT: Front kamera ayna görüntüsü verir, bu yüzden yaw açısı ters çalışır
   * Kullanıcı sola çevirince kamera pozitif yaw verir
   */
  const checkTurnLeft = useCallback((face: Face): boolean => {
    const yaw = face.yawAngle;
    
    // Front kamera ayna: Sola çevirme = pozitif yaw açısı
    if (yaw > THRESHOLDS.turnAngleThreshold) {
      console.log(`[Liveness] Turn Left: yaw=${yaw.toFixed(1)}° - DETECTED!`);
      return true;
    }
    
    return false;
  }, []);
  
  /**
   * Yüz validasyonu
   */
  const validateFace = useCallback((faces: Face[]): { valid: boolean; message: string; face?: Face } => {
    if (faces.length === 0) {
      return { valid: false, message: 'Yüzünüzü çerçeveye yerleştirin' };
    }
    
    if (faces.length > 1) {
      return { valid: false, message: 'Yalnızca bir kişi olmalı' };
    }
    
    const face = faces[0];
    
    // Yüz boyutu kontrolü
    if (face.bounds.width < THRESHOLDS.minFaceSize || face.bounds.height < THRESHOLDS.minFaceSize) {
      return { valid: false, message: 'Kameraya yaklaşın', face };
    }
    
    return { valid: true, message: '', face };
  }, []);
  
  /**
   * Frame işleme - ana detection logic
   */
  const processFrame = useCallback((faces: Face[]): {
    stepCompleted: boolean;
    faceValid: boolean;
    message: string;
  } => {
    if (!state.isProcessing || state.isComplete) {
      return { stepCompleted: false, faceValid: false, message: '' };
    }
    
    frameCountRef.current++;
    
    // Yüz validasyonu
    const validation = validateFace(faces);
    if (!validation.valid || !validation.face) {
      return { stepCompleted: false, faceValid: false, message: validation.message };
    }
    
    const face = validation.face;
    const step = currentStep;
    
    // Timeout kontrolü
    if (stepStartTimeRef.current && Date.now() - stepStartTimeRef.current > THRESHOLDS.stepTimeout) {
      setState(prev => ({
        ...prev,
        error: `${currentStepConfig?.title} için süre doldu. Tekrar deneyin.`,
      }));
      return { stepCompleted: false, faceValid: true, message: 'Süre doldu' };
    }
    
    // Her 5 frame'de bir kaydet
    if (frameCountRef.current % 5 === 0) {
      recordFrame(face, step);
    }
    
    // Adıma göre kontrol
    let stepCompleted = false;
    
    switch (step) {
      case 'blink':
        stepCompleted = checkBlink(face);
        break;
      case 'smile':
        stepCompleted = checkSmile(face);
        break;
      case 'turn_right':
        stepCompleted = checkTurnRight(face);
        break;
      case 'turn_left':
        stepCompleted = checkTurnLeft(face);
        break;
    }
    
    if (stepCompleted) {
      goToNextStep();
    }
    
    return { stepCompleted, faceValid: true, message: '' };
  }, [
    state.isProcessing, 
    state.isComplete, 
    currentStep, 
    currentStepConfig,
    validateFace, 
    recordFrame, 
    checkBlink, 
    checkSmile, 
    checkTurnRight, 
    checkTurnLeft,
    goToNextStep
  ]);
  
  /**
   * Liveness sonucunu hesapla
   */
  const getResult = useCallback((): LivenessResult => {
    const totalTime = state.startTime ? Date.now() - state.startTime : 0;
    
    // Skor hesapla (max 25 puan)
    let score = 0;
    
    // Her adım 6 puan
    score += state.completedSteps.length * 6;
    
    // Bonus: Hızlı tamamlama (< 20 saniye)
    if (totalTime < 20000 && state.completedSteps.length === 4) {
      score += 1;
    }
    
    return {
      success: state.isComplete,
      completedSteps: state.completedSteps,
      frames: state.frames,
      totalTime,
      score: Math.min(score, 25),
    };
  }, [state]);
  
  /**
   * Hata temizle
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    stepStartTimeRef.current = Date.now();
  }, []);
  
  return {
    // State
    currentStep,
    currentStepConfig,
    currentStepIndex: state.currentStepIndex,
    totalSteps: LIVENESS_STEPS.length,
    completedSteps: state.completedSteps,
    isProcessing: state.isProcessing,
    isComplete: state.isComplete,
    error: state.error,
    
    // Actions
    startLiveness,
    stopLiveness,
    resetLiveness,
    processFrame,
    getResult,
    clearError,
    
    // Face detection
    detectFaces,
    stopListeners,
  };
}

/**
 * Liveness skoru hesapla (backend için)
 */
export function calculateLivenessScore(frames: LivenessFrame[]): number {
  if (frames.length === 0) return 0;
  
  // Tamamlanan adımları say
  const completedSteps = new Set(frames.map(f => f.step)).size;
  
  // Her adım 6 puan
  let score = completedSteps * 6;
  
  // Bonus: Hızlı tamamlama
  if (frames.length > 0) {
    const totalTime = frames[frames.length - 1].timestamp - frames[0].timestamp;
    if (totalTime < 20000 && completedSteps === 4) {
      score += 1;
    }
  }
  
  return Math.min(score, 25);
}
