/**
 * VisionCamera Types
 *
 * Kamera component'ı için tip tanımlamaları
 * Tüm alt component'ler bu tipleri kullanır
 */

import type { CameraPosition } from "react-native-vision-camera";

// =============================================
// CAMERA SETTINGS
// =============================================

/**
 * Fotoğraf kalitesi ayarı
 * - low: Düşük kalite, küçük dosya (~500KB)
 * - medium: Orta kalite, dengeli (~1MB)
 * - high: Yüksek kalite, büyük dosya (~2MB)
 */
export type PhotoQuality = "low" | "medium" | "high";

/**
 * Video kalitesi ayarı
 * - 720p: HD (1280x720) - Hızlı yükleme
 * - 1080p: Full HD (1920x1080) - Dengeli
 */
export type VideoQuality = "720p" | "1080p";

/**
 * Kamera ayarları
 */
export interface CameraSettings {
  /** Fotoğraf kalitesi */
  photoQuality: PhotoQuality;
  /** Video kalitesi */
  videoQuality: VideoQuality;
  /** Fotoğraf sıkıştırma (0-100) */
  photoCompression: number;
  /** Video FPS */
  videoFps: 30 | 60;
  /** HDR varsayılan olarak açık mı */
  hdrEnabled: boolean;
  /** Video stabilizasyon */
  videoStabilization: boolean;
  /** Konum bilgisi ekle */
  enableLocation: boolean;
  /** Shutter sesi */
  shutterSound: boolean;
}

/**
 * Varsayılan kamera ayarları
 */
export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  photoQuality: "medium",
  videoQuality: "1080p",
  photoCompression: 80, // %80 kalite - iyi denge
  videoFps: 30,
  hdrEnabled: false,
  videoStabilization: true,
  enableLocation: false,
  shutterSound: true
};

/**
 * Kamera modu
 * - photo: Fotoğraf çekimi
 * - video: Video kaydı
 */
export type CameraMode = "photo" | "video";

/**
 * Flash durumu
 * - off: Kapalı
 * - on: Açık
 * - auto: Otomatik
 */
export type FlashMode = "off" | "on" | "auto";

/**
 * Yakalanan medya bilgisi
 * Fotoğraf veya video çekildikten sonra döner
 */
export interface CapturedMedia {
  /** Medya tipi */
  type: "photo" | "video";
  /** Dosya yolu (file://) */
  path: string;
  /** Genişlik (piksel) */
  width: number;
  /** Yükseklik (piksel) */
  height: number;
  /** Video süresi (saniye) - sadece video için */
  duration?: number;
}

/**
 * VisionCamera ana component props
 */
export interface VisionCameraProps {
  /** Başlangıç modu (varsayılan: photo) */
  mode?: CameraMode;
  /** Başlangıç kamera pozisyonu (varsayılan: back) */
  initialPosition?: CameraPosition;
  /** Ses kaydı aktif mi (varsayılan: true) */
  enableAudio?: boolean;
  /** Kontroller gösterilsin mi (varsayılan: true) */
  showControls?: boolean;
  /** Medya yakalandığında çağrılır */
  onCapture?: (media: CapturedMedia) => void;
  /** Kapatma butonuna basıldığında çağrılır */
  onClose?: () => void;
  /** Hata oluştuğunda çağrılır */
  onError?: (error: Error) => void;
  /** Maksimum video süresi - saniye (varsayılan: 60) */
  maxVideoDuration?: number;
  /** Ek stil */
  style?: object;
}

/**
 * Üst kontroller props
 */
export interface TopControlsProps {
  /** Flash modu */
  flash: FlashMode;
  /** Flash toggle fonksiyonu */
  onFlashToggle: () => void;
  /** Kapatma fonksiyonu */
  onClose?: () => void;
  /** Cihazda flash var mı */
  hasFlash?: boolean;
  /** HDR aktif mi */
  hdrEnabled?: boolean;
  /** HDR toggle fonksiyonu */
  onHdrToggle?: () => void;
  /** HDR destekleniyor mu */
  supportsHdr?: boolean;
  /** Ayarlar butonuna basıldığında */
  onSettings?: () => void;
}

/**
 * Alt kontroller props
 */
export interface BottomControlsProps {
  /** Mevcut mod */
  currentMode: CameraMode;
  /** Mod değiştirme fonksiyonu */
  onModeChange: (mode: CameraMode) => void;
  /** Kayıt yapılıyor mu */
  isRecording: boolean;
  /** Yakalama işlemi yapılıyor mu */
  isCapturing: boolean;
  /** Yakalama butonu fonksiyonu */
  onCapture: () => void;
  /** Kamera çevirme fonksiyonu */
  onFlipCamera: () => void;
  /** Accent rengi (theme'den) */
  accentColor: string;
}

/**
 * Kayıt göstergesi props
 */
export interface RecordingIndicatorProps {
  /** Kayıt süresi (saniye) */
  duration: number;
  /** Kayıt duraklatıldı mı */
  isPaused?: boolean;
  /** Duraklatma fonksiyonu */
  onPause?: () => void;
  /** Devam ettirme fonksiyonu */
  onResume?: () => void;
  /** İptal fonksiyonu */
  onCancel?: () => void;
  /** Snapshot fonksiyonu */
  onSnapshot?: () => void;
}

/**
 * Zoom göstergesi props
 */
export interface ZoomIndicatorProps {
  /** Zoom değeri (1.0x, 2.0x, vb.) */
  zoom: number;
  /** Zoom değiştirme fonksiyonu */
  onZoomChange?: (zoom: number) => void;
  /** Min zoom (0.5x için) */
  minZoom?: number;
  /** Max zoom */
  maxZoom?: number;
  /** Neutral zoom (1x için) */
  neutralZoom?: number;
}

/**
 * Mod seçici props
 */
export interface ModeSelectorProps {
  /** Mevcut mod */
  currentMode: CameraMode;
  /** Mod değiştirme fonksiyonu */
  onModeChange: (mode: CameraMode) => void;
  /** Accent rengi */
  accentColor: string;
  /** Kayıt sırasında devre dışı */
  disabled?: boolean;
}

/**
 * Yakalama butonu props
 */
export interface CaptureButtonProps {
  /** Mevcut mod */
  mode: CameraMode;
  /** Kayıt yapılıyor mu */
  isRecording: boolean;
  /** Yakalama işlemi yapılıyor mu */
  isCapturing: boolean;
  /** Basıldığında çağrılır */
  onPress: () => void;
}

/**
 * UI metinleri - Türkçe
 */
export const UI_TEXTS = {
  // İzin ekranı
  permissionRequired: "Kamera izni gerekli",
  grantPermission: "İzin Ver",
  loading: "Kamera yükleniyor...",

  // Modlar
  modePhoto: "Fotoğraf",
  modeVideo: "Video",

  // Flash
  flashOff: "Kapalı",
  flashOn: "Açık",
  flashAuto: "Otomatik",

  // Kayıt
  recording: "Kayıt",
  paused: "Duraklatıldı",

  // Hatalar
  errorCameraNotAvailable: "Kamera kullanılamıyor",
  errorCameraInUse: "Kamera başka uygulama tarafından kullanılıyor",
  errorPermissionDenied: "Kamera izni reddedildi",
  errorSessionFailed: "Kamera açılamadı",
  errorInsufficientStorage: "Yetersiz depolama alanı",
  errorRecordingInProgress: "Kayıt zaten devam ediyor",
  errorUnknown: "Bilinmeyen hata oluştu",

  // HDR
  hdrOn: "HDR Açık",
  hdrOff: "HDR Kapalı",

  // Exposure
  exposure: "Pozlama",
} as const;
