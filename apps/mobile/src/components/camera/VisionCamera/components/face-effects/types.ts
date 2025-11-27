/**
 * Face Effects - Type Definitions
 *
 * Yüz efektleri için tip tanımlamaları
 * MLKit Face Detector ve Skia overlay için kullanılır
 *
 * @module face-effects/types
 */

// =============================================
// FACE LANDMARK TYPES
// =============================================

/**
 * 2D nokta koordinatı
 * Ekran koordinat sisteminde (x, y)
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Yüz landmark noktaları
 * MLKit Face Detector'dan dönen landmark'lar
 */
export interface FaceLandmarks {
  /** Sol göz merkezi */
  leftEye: Point2D;
  /** Sağ göz merkezi */
  rightEye: Point2D;
  /** Burun ucu */
  noseTip: Point2D;
  /** Burun tabanı */
  noseBase: Point2D;
  /** Sol kulak */
  leftEar: Point2D;
  /** Sağ kulak */
  rightEar: Point2D;
  /** Ağız sol köşesi */
  leftMouth: Point2D;
  /** Ağız sağ köşesi */
  rightMouth: Point2D;
  /** Alt dudak merkezi */
  bottomMouth: Point2D;
  /** Sol yanak */
  leftCheek: Point2D;
  /** Sağ yanak */
  rightCheek: Point2D;
}

/**
 * Yüz konturu noktaları (opsiyonel - performans için kapalı tutulabilir)
 * Makyaj efektleri için gerekli
 */
export interface FaceContours {
  /** Yüz oval konturu */
  faceOval?: Point2D[];
  /** Sol göz konturu */
  leftEye?: Point2D[];
  /** Sağ göz konturu */
  rightEye?: Point2D[];
  /** Sol kaş konturu */
  leftEyebrow?: Point2D[];
  /** Sağ kaş konturu */
  rightEyebrow?: Point2D[];
  /** Üst dudak konturu */
  upperLip?: Point2D[];
  /** Alt dudak konturu */
  lowerLip?: Point2D[];
  /** Burun köprüsü */
  noseBridge?: Point2D[];
  /** Burun alt konturu */
  noseBottom?: Point2D[];
}

/**
 * Baş rotasyonu (Euler açıları)
 * Derece cinsinden
 */
export interface HeadRotation {
  /** Yatay dönüş (-45 ile 45 arası) */
  yaw: number;
  /** Dikey eğim (-45 ile 45 arası) */
  pitch: number;
  /** Yana yatma (-45 ile 45 arası) */
  roll: number;
}

/**
 * Yüz sınırlayıcı kutusu
 */
export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Algılanan yüz verisi
 * Frame processor'dan UI thread'e aktarılır
 */
export interface FaceData {
  /** Yüz takip ID'si */
  id: number;
  /** Sınırlayıcı kutu */
  bounds: FaceBounds;
  /** Landmark noktaları */
  landmarks: FaceLandmarks;
  /** Baş rotasyonu */
  rotation: HeadRotation;
  /** Kontür noktaları (opsiyonel) */
  contours?: FaceContours;
  /** Gülümseme olasılığı (0-1) */
  smilingProbability?: number;
  /** Sol göz açık olasılığı (0-1) */
  leftEyeOpenProbability?: number;
  /** Sağ göz açık olasılığı (0-1) */
  rightEyeOpenProbability?: number;
}

// =============================================
// FACE EFFECT TYPES
// =============================================

/**
 * Efekt kategorileri
 */
export type FaceEffectCategory =
  | "accessories" // Gözlük, şapka, taç
  | "makeup" // Ruj, göz farı, eyeliner
  | "beauty" // Cilt düzeltme, glow
  | "masks" // Hayvan yüzleri, karakterler
  | "particles"; // Parıltı, kalpler, kar

/**
 * Efekt türleri
 */
export type FaceEffectType =
  // Aksesuarlar
  | "glasses"
  | "sunglasses"
  | "crown"
  | "hat"
  | "ears" // Kedi/tavşan kulakları
  // Makyaj
  | "lipstick"
  | "eyeliner"
  | "eyeshadow"
  | "blush"
  | "contour"
  // Güzellik
  | "skin_smooth"
  | "skin_tone"
  | "glow"
  | "brighten"
  // Maskeler
  | "cat_face"
  | "dog_face"
  | "bunny_face"
  | "anime_eyes"
  // Parçacıklar
  | "sparkle"
  | "hearts"
  | "snow"
  | "glitter";

/**
 * Efekt konfigürasyonu
 */
export interface FaceEffectConfig {
  /** Efekt ID'si */
  id: string;
  /** Efekt türü */
  type: FaceEffectType;
  /** Kategori */
  category: FaceEffectCategory;
  /** Efekt adı (UI için) */
  name: string;
  /** Efekt açık mı */
  enabled: boolean;
  /** Yoğunluk (0-1) */
  intensity: number;
  /** Renk (makyaj için) */
  color?: string;
  /** Asset yolu (PNG/SVG) */
  asset?: string;
  /** İkon (emoji veya icon name) */
  icon?: string;
  /** Thumbnail yolu */
  thumbnail?: string;
  /** Ek parametreler */
  params?: Record<string, number | string | boolean>;
}

/**
 * Efekt preset'i
 */
export interface FaceEffectPreset {
  /** Preset ID'si */
  id: string;
  /** Preset adı */
  name: string;
  /** Thumbnail yolu */
  thumbnail: string;
  /** Aktif efektler */
  effects: FaceEffectConfig[];
}

// =============================================
// FACE DETECTION OPTIONS
// =============================================

/**
 * Performans modu
 */
export type PerformanceMode = "fast" | "accurate";

/**
 * Yüz algılama seçenekleri
 */
export interface FaceDetectionOptions {
  /** Performans modu */
  performanceMode: PerformanceMode;
  /** Landmark algılama */
  landmarkMode: "none" | "all";
  /** Kontür algılama (performans etkisi yüksek) */
  contourMode: "none" | "all";
  /** Sınıflandırma (gülümseme, göz açık) */
  classificationMode: "none" | "all";
  /** Minimum yüz boyutu (0-1 arası oran) */
  minFaceSize: number;
  /** Yüz takibi aktif mi */
  trackingEnabled: boolean;
  /** Maksimum yüz sayısı */
  maxFaces: number;
}

/**
 * Varsayılan yüz algılama seçenekleri
 * Performans için optimize edilmiş
 */
export const DEFAULT_FACE_DETECTION_OPTIONS: FaceDetectionOptions = {
  performanceMode: "fast",
  landmarkMode: "all",
  contourMode: "none", // Performans için kapalı
  classificationMode: "all",
  minFaceSize: 0.15,
  trackingEnabled: true,
  maxFaces: 1,
};

// =============================================
// HOOK RETURN TYPES
// =============================================

/**
 * useFaceDetection hook dönüş tipi
 */
export interface UseFaceDetectionReturn {
  /** Algılanan yüzler */
  faces: FaceData[];
  /** Frame processor */
  frameProcessor: ReturnType<typeof import("react-native-vision-camera").useFrameProcessor>;
  /** Yüz algılama aktif mi */
  isDetecting: boolean;
  /** En az bir yüz algılandı mı */
  hasFace: boolean;
  /** Algılama durdur */
  stopDetection: () => void;
}

/**
 * useFaceEffects hook dönüş tipi
 */
export interface UseFaceEffectsReturn {
  /** Aktif efektler */
  activeEffects: FaceEffectConfig[];
  /** Efekt ekle */
  addEffect: (effect: FaceEffectConfig) => void;
  /** Efekt kaldır */
  removeEffect: (effectId: string) => void;
  /** Efekt güncelle */
  updateEffect: (effectId: string, updates: Partial<FaceEffectConfig>) => void;
  /** Tüm efektleri temizle */
  clearEffects: () => void;
  /** Preset uygula */
  applyPreset: (preset: FaceEffectPreset) => void;
  /** Efekt yoğunluğunu ayarla */
  setIntensity: (effectId: string, intensity: number) => void;
}

// =============================================
// UTILITY TYPES
// =============================================

/**
 * Efekt render props
 */
export interface FaceEffectRenderProps {
  /** Yüz verisi */
  face: FaceData;
  /** Efekt konfigürasyonu */
  effect: FaceEffectConfig;
  /** Canvas genişliği */
  canvasWidth: number;
  /** Canvas yüksekliği */
  canvasHeight: number;
}

/**
 * Overlay props
 */
export interface FaceEffectOverlayProps {
  /** Algılanan yüzler */
  faces: FaceData[];
  /** Aktif efektler */
  effects: FaceEffectConfig[];
  /** Overlay genişliği */
  width: number;
  /** Overlay yüksekliği */
  height: number;
  /** Kamera pozisyonu (mirror için) */
  cameraPosition: "front" | "back";
  /** Frame boyutları (koordinat dönüşümü için) */
  frameSize: { width: number; height: number };
}
