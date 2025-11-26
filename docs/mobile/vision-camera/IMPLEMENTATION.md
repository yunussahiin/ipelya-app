# Mevcut VisionCamera Implementasyonu Analizi

## Dosya Konumu
`apps/mobile/src/components/camera/VisionCamera/index.tsx`

## Mevcut Props

```typescript
interface VisionCameraProps {
  mode?: CameraMode;              // 'photo' | 'video'
  initialPosition?: CameraPosition; // 'back' | 'front'
  enableAudio?: boolean;          // Video için ses kaydı
  showControls?: boolean;         // UI kontrolleri göster
  onCapture?: (media: CapturedMedia) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  maxVideoDuration?: number;      // Saniye cinsinden
  style?: object;
}

interface CapturedMedia {
  type: 'photo' | 'video';
  path: string;
  width: number;
  height: number;
  duration?: number;  // Video için
}
```

## Mevcut Özellikler Analizi

### ✅ Çalışan Özellikler

#### 1. Kamera Cihaz Seçimi
```typescript
const device = useCameraDevice(cameraPosition, {
  physicalDevices: ["ultra-wide-angle-camera", "wide-angle-camera", "telephoto-camera"]
});
```
- Triple camera desteği var
- Ön/arka geçiş çalışıyor

#### 2. Format Seçimi
```typescript
const format = useCameraFormat(device, [
  { videoResolution: { width: 1920, height: 1080 } },
  { photoResolution: "max" },
  { fps: 60 }
]);
```
- 1080p video
- Max photo resolution
- 60 FPS

#### 3. Zoom (Reanimated)
```typescript
const ReanimatedCamera = Animated.createAnimatedComponent(Camera);
Animated.addWhitelistedNativeProps({ zoom: true });

const zoom = useSharedValue(device?.neutralZoom ?? 1);
const animatedProps = useAnimatedProps(() => ({
  zoom: zoom.value
}));

const pinchGesture = Gesture.Pinch()
  .onBegin(() => {
    zoomOffset.value = zoom.value;
  })
  .onUpdate((event) => {
    const z = zoomOffset.value * event.scale;
    const newZoom = interpolate(z, [1, 10], [device?.minZoom ?? 1, Math.min(device?.maxZoom ?? 10, 10)], Extrapolation.CLAMP);
    zoom.value = newZoom;
  });
```
- Pinch-to-zoom çalışıyor
- Zoom indicator gösteriliyor

#### 4. Focus
```typescript
const tapGesture = Gesture.Tap().onEnd((event) => {
  if (cameraRef.current && device?.supportsFocus) {
    cameraRef.current.focus({ x: event.x, y: event.y });
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
  }
});
```
- Tap-to-focus çalışıyor
- Haptic feedback var

#### 5. Fotoğraf Çekimi
```typescript
const photo = await cameraRef.current.takePhoto({
  flash: flash,
  enableAutoRedEyeReduction: true,
  enableAutoDistortionCorrection: true,
  enableShutterSound: true
});
```
- Flash desteği (off/on/auto)
- Red eye reduction
- Distortion correction
- Shutter sound

#### 6. Video Kayıt
```typescript
cameraRef.current.startRecording({
  flash: flash === "on" ? "on" : "off",
  fileType: "mp4",
  videoCodec: "h265",
  onRecordingError: (error) => { ... },
  onRecordingFinished: (video) => { ... }
});
```
- H.265 codec
- MP4 format
- Flash desteği

#### 7. Camera Props
```typescript
<ReanimatedCamera
  ref={cameraRef}
  style={StyleSheet.absoluteFill}
  device={device}
  format={format}
  isActive={true}
  photo={currentMode === "photo"}
  video={currentMode === "video"}
  audio={enableAudio && hasMicPermission}
  torch={torch ? "on" : "off"}
  enableZoomGesture={false}  // Manuel zoom kullanıyoruz
  animatedProps={animatedProps}
  photoHdr={format?.supportsPhotoHdr}
  videoHdr={format?.supportsVideoHdr}
  videoStabilizationMode="cinematic"
  lowLightBoost={device.supportsLowLightBoost}
/>
```

---

## ❌ Eksik Özellikler

### 1. Türkçe UI Metinleri
**Mevcut:**
- "Kamera izni gerekli" ✅
- "İzin Ver" ✅
- "Kamera yükleniyor..." ✅

**Eksik:**
- Mode selector'da icon var, text yok
- Flash auto için sadece "A" yazıyor

### 2. Pause/Resume Recording
```typescript
// Mevcut: YOK
// Olması gereken:
await camera.current.pauseRecording();
await camera.current.resumeRecording();
```

### 3. Cancel Recording
```typescript
// Mevcut: YOK
// Olması gereken:
await camera.current.cancelRecording();
```

### 4. Snapshot (Hızlı Çekim)
```typescript
// Mevcut: YOK
// Olması gereken:
const snapshot = await camera.current.takeSnapshot({
  quality: 85
});
```

### 5. Exposure Kontrolü
```typescript
// Mevcut: YOK
// Olması gereken:
<Camera exposure={exposureValue} />
```

### 6. Photo Quality Balance
```typescript
// Mevcut: YOK
// Olması gereken:
<Camera photoQualityBalance="quality" />
```

### 7. Video Bit Rate
```typescript
// Mevcut: YOK
// Olması gereken:
<Camera videoBitRate="high" />
```

### 8. QR/Barcode Tarama
```typescript
// Mevcut: YOK
// Olması gereken:
const codeScanner = useCodeScanner({ ... });
<Camera codeScanner={codeScanner} />
```

### 9. Location Metadata
```typescript
// Mevcut: YOK
// Olması gereken:
<Camera enableLocation={true} />
```

### 10. Orientation Kontrolü
```typescript
// Mevcut: YOK
// Olması gereken:
<Camera 
  outputOrientation="device"
  onOutputOrientationChanged={(o) => { ... }}
/>
```

### 11. Mirror Mode
```typescript
// Mevcut: YOK (front camera için otomatik)
// Olması gereken:
<Camera isMirrored={true} />
```

### 12. Preview Resize Mode
```typescript
// Mevcut: YOK
// Olması gereken:
<Camera resizeMode="cover" />
```

### 13. Error Handling (Detaylı)
```typescript
// Mevcut: Basit console.error
// Olması gereken: Error code bazlı handling
<Camera 
  onError={(error) => {
    switch (error.code) {
      case 'device/camera-not-available':
        // ...
    }
  }}
/>
```

---

## Kullanım Yerleri

### 1. StoryCreator
```typescript
// apps/mobile/src/components/home-feed/ContentCreator/StoryCreator.tsx
<VisionCamera
  mode="photo"  // veya video
  onCapture={handleCapture}
  onClose={onClose}
/>
```

### 2. ReelsCreator
```typescript
// apps/mobile/src/components/home-feed/ContentCreator/ReelsCreator.tsx
<VisionCamera
  mode="video"
  initialPosition="back"
  enableAudio={true}
  showControls={true}
  onCapture={handleCameraCapture}
  onClose={() => setShowCamera(false)}
  maxVideoDuration={90}  // Reels için 90 saniye
/>
```

---

## UI Analizi

### Top Controls
- Close button (X)
- Flash toggle (Zap/ZapOff/A)
- Settings placeholder (boş)

### Recording Indicator
- Kırmızı dot + süre göstergesi
- Pulse animasyonu

### Bottom Controls
- Mode selector (Photo/Video icons)
- Capture button (Circle/Square)
- Flip camera button (RotateCcw)

### Zoom Indicator
- "1.0x" formatında gösteriliyor

---

## Stil Analizi

### Renkler
- Background: `#000` (hardcoded)
- Controls background: `rgba(0,0,0,0.4)`
- Recording: `#FF3B30`
- Flash active: `#FFD700`
- Text: `#FFF`

### Boyutlar
- Control button: 44x44
- Capture button: 80x80
- Flip button: 50x50
- Top controls: top 60px
- Bottom controls: bottom 50px

---

## Performans Notları

1. **Reanimated Camera** - Zoom animasyonu native thread'de
2. **Gesture Handler** - Native gesture handling
3. **Format Selection** - 1080p + 60 FPS optimize
4. **Video Codec** - H.265 (daha küçük dosya boyutu)
5. **Cinematic Stabilization** - Video stabilizasyonu aktif
