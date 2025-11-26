# React Native Vision Camera - API Referansı

## Camera Component Props

### Core Props

| Prop       | Tip            | Default | Açıklama                             |
| ---------- | -------------- | ------- | ------------------------------------ |
| `device`   | `CameraDevice` | -       | Kullanılacak kamera cihazı (zorunlu) |
| `isActive` | `boolean`      | `true`  | Kamera aktif mi?                     |
| `photo`    | `boolean`      | `false` | Fotoğraf çekimi aktif                |
| `video`    | `boolean`      | `false` | Video kaydı aktif                    |
| `audio`    | `boolean`      | `false` | Ses kaydı aktif                      |

### Format & Quality

| Prop                  | Tip                                     | Default      | Açıklama                    |
| --------------------- | --------------------------------------- | ------------ | --------------------------- |
| `format`              | `CameraFormat`                          | -            | Kamera formatı              |
| `fps`                 | `number`                                | -            | Frame rate                  |
| `photoQualityBalance` | `'speed' \| 'balanced' \| 'quality'`    | `'balanced'` | Fotoğraf kalite/hız dengesi |
| `videoBitRate`        | `'low' \| 'normal' \| 'high' \| number` | `'normal'`   | Video bit rate              |

### HDR & Low Light

| Prop            | Tip       | Default | Açıklama        |
| --------------- | --------- | ------- | --------------- |
| `photoHdr`      | `boolean` | `false` | Photo HDR aktif |
| `videoHdr`      | `boolean` | `false` | Video HDR aktif |
| `lowLightBoost` | `boolean` | `false` | Gece modu aktif |

### Flash & Torch

| Prop    | Tip             | Default | Açıklama             |
| ------- | --------------- | ------- | -------------------- |
| `torch` | `'on' \| 'off'` | `'off'` | Torch (fener) durumu |

### Zoom & Focus

| Prop                | Tip       | Default | Açıklama            |
| ------------------- | --------- | ------- | ------------------- |
| `zoom`              | `number`  | `1`     | Zoom seviyesi       |
| `enableZoomGesture` | `boolean` | `false` | Native zoom gesture |
| `exposure`          | `number`  | `0`     | Exposure değeri     |

### Video Stabilization

| Prop                     | Tip                                                          | Default | Açıklama           |
| ------------------------ | ------------------------------------------------------------ | ------- | ------------------ |
| `videoStabilizationMode` | `'off' \| 'standard' \| 'cinematic' \| 'cinematic-extended'` | -       | Stabilizasyon modu |

### Orientation & Mirror

| Prop                | Tip           | Default    | Açıklama   |
| ------------------- | ------------- | ---------- | ---------- |
| `outputOrientation` | `Orientation` | `'device'` | Çıktı yönü |
| `isMirrored`        | `boolean`     | `false`    | Ayna modu  |

### Preview

| Prop         | Tip                    | Default   | Açıklama          |
| ------------ | ---------------------- | --------- | ----------------- |
| `preview`    | `boolean`              | `true`    | Preview göster    |
| `resizeMode` | `'cover' \| 'contain'` | `'cover'` | Preview ölçekleme |

### Location

| Prop             | Tip       | Default | Açıklama          |
| ---------------- | --------- | ------- | ----------------- |
| `enableLocation` | `boolean` | `false` | GPS metadata ekle |

### Code Scanner

| Prop          | Tip           | Default | Açıklama            |
| ------------- | ------------- | ------- | ------------------- |
| `codeScanner` | `CodeScanner` | -       | QR/Barcode tarayıcı |

### Frame Processor

| Prop             | Tip              | Default | Açıklama                   |
| ---------------- | ---------------- | ------- | -------------------------- |
| `frameProcessor` | `FrameProcessor` | -       | Frame processor fonksiyonu |

### Callbacks

| Prop                          | Tip                                   | Açıklama                  |
| ----------------------------- | ------------------------------------- | ------------------------- |
| `onInitialized`               | `() => void`                          | Kamera hazır olduğunda    |
| `onError`                     | `(error: CameraRuntimeError) => void` | Hata oluştuğunda          |
| `onOutputOrientationChanged`  | `(orientation: Orientation) => void`  | Yön değiştiğinde          |
| `onPreviewOrientationChanged` | `(orientation: Orientation) => void`  | Preview yönü değiştiğinde |
| `onUIRotationChanged`         | `(rotation: number) => void`          | UI rotasyonu değiştiğinde |

---

## Camera Methods

### takePhoto()
```typescript
const photo = await camera.current.takePhoto({
  flash?: 'on' | 'off' | 'auto',
  enableAutoRedEyeReduction?: boolean,
  enableAutoDistortionCorrection?: boolean,
  enableShutterSound?: boolean,
});

// Return: PhotoFile
interface PhotoFile {
  path: string;
  width: number;
  height: number;
  orientation: Orientation;
  isMirrored: boolean;
  metadata?: {
    Orientation: number;
    DPIHeight: number;
    DPIWidth: number;
    // ...
  };
}
```

### takeSnapshot()
```typescript
const snapshot = await camera.current.takeSnapshot({
  quality?: number,  // 0-100
});

// Return: PhotoFile
```

### startRecording()
```typescript
camera.current.startRecording({
  flash?: 'on' | 'off',
  fileType?: 'mp4' | 'mov',
  videoCodec?: 'h264' | 'h265',
  onRecordingFinished: (video: VideoFile) => void,
  onRecordingError: (error: CameraCaptureError) => void,
});

// VideoFile
interface VideoFile {
  path: string;
  width: number;
  height: number;
  duration: number;
}
```

### stopRecording()
```typescript
await camera.current.stopRecording();
```

### pauseRecording()
```typescript
await camera.current.pauseRecording();
```

### resumeRecording()
```typescript
await camera.current.resumeRecording();
```

### cancelRecording()
```typescript
await camera.current.cancelRecording();
```

### focus()
```typescript
await camera.current.focus({
  x: number,  // Tap X koordinatı
  y: number,  // Tap Y koordinatı
});
```

---

## Hooks

### useCameraDevice()
```typescript
const device = useCameraDevice(
  position: 'back' | 'front' | 'external',
  options?: {
    physicalDevices?: PhysicalCameraDeviceType[]
  }
);

// PhysicalCameraDeviceType
type PhysicalCameraDeviceType = 
  | 'ultra-wide-angle-camera'
  | 'wide-angle-camera'
  | 'telephoto-camera';
```

### useCameraDevices()
```typescript
const devices = useCameraDevices();
// Return: CameraDevice[]
```

### useCameraFormat()
```typescript
const format = useCameraFormat(
  device: CameraDevice,
  filters: FormatFilter[]
);

// FormatFilter örnekleri
[
  { videoResolution: { width: 1920, height: 1080 } },
  { photoResolution: 'max' },
  { fps: 60 },
  { videoHdr: true },
  { photoHdr: true },
  { videoAspectRatio: 16 / 9 },
  { videoStabilizationMode: 'cinematic' },
]
```

### useCameraPermission()
```typescript
const { hasPermission, requestPermission } = useCameraPermission();
```

### useMicrophonePermission()
```typescript
const { hasPermission, requestPermission } = useMicrophonePermission();
```

### useLocationPermission()
```typescript
const { hasPermission, requestPermission } = useLocationPermission();
```

### useCodeScanner()
```typescript
const codeScanner = useCodeScanner({
  codeTypes: CodeType[],
  onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void,
});

// CodeType
type CodeType = 
  | 'qr'
  | 'ean-13'
  | 'ean-8'
  | 'code-128'
  | 'code-39'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'
  | 'upc-e'
  | 'upc-a'
  | 'itf'
  | 'codabar';

// Code
interface Code {
  type: CodeType;
  value: string;
  corners?: Point[];
  frame?: Rect;
}
```

### useFrameProcessor()
```typescript
const frameProcessor = useFrameProcessor((frame: Frame) => {
  'worklet'
  // Frame processing logic
}, [dependencies]);
```

### useSkiaFrameProcessor()
```typescript
const frameProcessor = useSkiaFrameProcessor((frame: DrawableFrame) => {
  'worklet'
  frame.render();  // Zorunlu
  // Skia drawing
}, [dependencies]);
```

---

## CameraDevice Properties

```typescript
interface CameraDevice {
  id: string;
  name: string;
  position: 'back' | 'front' | 'external';
  physicalDevices: PhysicalCameraDeviceType[];
  
  // Flash & Torch
  hasFlash: boolean;
  hasTorch: boolean;
  
  // Zoom
  minZoom: number;
  maxZoom: number;
  neutralZoom: number;
  
  // Exposure
  minExposure: number;
  maxExposure: number;
  
  // Features
  supportsLowLightBoost: boolean;
  supportsRawCapture: boolean;
  supportsFocus: boolean;
  
  // Hardware
  hardwareLevel: 'legacy' | 'limited' | 'full' | 'level-3';
  
  // Formats
  formats: CameraFormat[];
}
```

---

## CameraFormat Properties

```typescript
interface CameraFormat {
  // Resolution
  photoWidth: number;
  photoHeight: number;
  videoWidth: number;
  videoHeight: number;
  
  // FPS
  minFps: number;
  maxFps: number;
  
  // HDR
  supportsPhotoHdr: boolean;
  supportsVideoHdr: boolean;
  
  // Stabilization
  videoStabilizationModes: VideoStabilizationMode[];
  
  // Other
  autoFocusSystem: 'none' | 'contrast-detection' | 'phase-detection';
  supportsDepthCapture: boolean;
}
```

---

## Error Codes

### CameraRuntimeError Codes

| Code                                      | Açıklama                                      |
| ----------------------------------------- | --------------------------------------------- |
| `device/camera-not-available`             | Kamera mevcut değil                           |
| `device/camera-in-use-by-another-client`  | Kamera başka uygulama tarafından kullanılıyor |
| `device/configuration-error`              | Konfigürasyon hatası                          |
| `device/microphone-unavailable`           | Mikrofon kullanılamıyor                       |
| `permission/camera-permission-denied`     | Kamera izni reddedildi                        |
| `permission/microphone-permission-denied` | Mikrofon izni reddedildi                      |
| `session/camera-cannot-be-opened`         | Kamera açılamadı                              |
| `session/audio-session-setup-failed`      | Ses oturumu başlatılamadı                     |

### CameraCaptureError Codes

| Code                               | Açıklama                 |
| ---------------------------------- | ------------------------ |
| `capture/insufficient-storage`     | Yetersiz depolama alanı  |
| `capture/file-io-error`            | Dosya yazma hatası       |
| `capture/recording-in-progress`    | Kayıt zaten devam ediyor |
| `capture/no-recording-in-progress` | Aktif kayıt yok          |
| `capture/aborted`                  | Kayıt iptal edildi       |
| `capture/unknown`                  | Bilinmeyen hata          |

---

## Expo Config

### app.json / app.config.js
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "$(PRODUCT_NAME) kameranıza erişmek istiyor.",
          "enableMicrophonePermission": true,
          "microphonePermissionText": "$(PRODUCT_NAME) mikrofonunuza erişmek istiyor.",
          "enableLocationPermission": true,
          "locationPermissionText": "$(PRODUCT_NAME) konumunuza erişmek istiyor."
        }
      ]
    ]
  }
}
```

---

## Platform Gereksinimleri

| Platform | Minimum Versiyon      |
| -------- | --------------------- |
| iOS      | 12.0+                 |
| Android  | SDK 21+ (Android 5.0) |

### Android Permissions (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### iOS Permissions (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>Kameranıza erişmek istiyoruz.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Mikrofonunuza erişmek istiyoruz.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Konumunuza erişmek istiyoruz.</string>
```
