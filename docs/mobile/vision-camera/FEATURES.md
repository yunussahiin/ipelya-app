# React Native Vision Camera - Tüm Özellikler

## 1. Fotoğraf Çekimi (Photo Capture)

### Temel Kullanım
```tsx
// Camera component'te photo={true} olmalı
<Camera
  ref={camera}
  device={device}
  isActive={true}
  photo={true}
/>

// Fotoğraf çekme
const photo = await camera.current.takePhoto({
  flash: 'on',                        // 'on' | 'off' | 'auto'
  enableAutoRedEyeReduction: true,    // Kırmızı göz düzeltme
  enableAutoDistortionCorrection: true, // Distorsiyon düzeltme
  enableShutterSound: true,           // Deklanşör sesi
});

console.log('Photo:', {
  path: photo.path,
  width: photo.width,
  height: photo.height,
  orientation: photo.orientation,
  isMirrored: photo.isMirrored,
});
```

### Hızlı Snapshot
```tsx
// takePhoto'dan daha hızlı, kalite düşük
const snapshot = await camera.current.takeSnapshot({
  quality: 85  // 0-100 arası
});
```

### Photo Quality Balance
```tsx
// Hız vs Kalite dengesi
<Camera
  {...props}
  photoQualityBalance="speed"  // 'speed' | 'balanced' | 'quality'
/>
```

### HDR Fotoğraf
```tsx
const format = useCameraFormat(device, [
  { photoHdr: true },
]);

<Camera
  format={format}
  photoHdr={format?.supportsPhotoHdr}
/>
```

---

## 2. Video Kayıt (Video Recording)

### Temel Kullanım
```tsx
// Camera component'te video={true} ve audio={true} olmalı
<Camera
  ref={camera}
  device={device}
  isActive={true}
  video={true}
  audio={true}
/>

// Kayıt başlat
camera.current.startRecording({
  flash: 'on',
  fileType: 'mp4',           // 'mp4' | 'mov'
  videoCodec: 'h265',        // 'h264' | 'h265' (HEVC)
  onRecordingError: (error) => {
    console.error('Recording error:', error);
  },
  onRecordingFinished: (video) => {
    console.log('Recording finished:', {
      path: video.path,
      duration: video.duration,
      width: video.width,
      height: video.height,
    });
  },
});

// Kayıt durdur
await camera.current.stopRecording();

// Kayıt iptal (dosya silinir)
await camera.current.cancelRecording();

// Kayıt duraklat/devam
await camera.current.pauseRecording();
await camera.current.resumeRecording();
```

### Video HDR
```tsx
const format = useCameraFormat(device, [
  { videoHdr: true },
]);

<Camera
  format={format}
  videoHdr={format?.supportsVideoHdr}
/>
```

### Video Bit Rate
```tsx
<Camera
  {...props}
  videoBitRate="high"  // 'low' | 'normal' | 'high' | number (custom)
/>

// Custom bit rate hesaplama
let bitRate = baseBitRate;
bitRate = bitRate / 30 * fps;           // FPS'e göre
if (videoHdr) bitRate *= 1.2;           // HDR için %20 artır
if (codec === 'h265') bitRate *= 0.8;   // H.265 için %20 azalt
```

### Video Stabilization
```tsx
const format = useCameraFormat(device, [
  { videoStabilizationMode: 'cinematic-extended' }
]);

// Desteklenen modlar: 'off' | 'standard' | 'cinematic' | 'cinematic-extended'
<Camera
  format={format}
  videoStabilizationMode="cinematic"
/>
```

---

## 3. Zoom Kontrolü

### Native Zoom Gesture
```tsx
<Camera
  {...props}
  enableZoomGesture={true}  // Basit pinch-to-zoom
/>
```

### Manuel Zoom (Reanimated ile)
```tsx
import Animated, { useSharedValue, useAnimatedProps } from 'react-native-reanimated';

const ReanimatedCamera = Animated.createAnimatedComponent(Camera);
Animated.addWhitelistedNativeProps({ zoom: true });

function MyCamera() {
  const zoom = useSharedValue(device?.neutralZoom ?? 1);

  const animatedProps = useAnimatedProps(() => ({
    zoom: zoom.value
  }));

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      zoom.value = interpolate(
        event.scale,
        [1, 10],
        [device?.minZoom ?? 1, device?.maxZoom ?? 10],
        Extrapolation.CLAMP
      );
    });

  return (
    <GestureDetector gesture={pinchGesture}>
      <ReanimatedCamera
        {...props}
        animatedProps={animatedProps}
      />
    </GestureDetector>
  );
}
```

### Zoom Limitleri
```tsx
const minZoom = device?.minZoom ?? 1;
const maxZoom = device?.maxZoom ?? 10;
const neutralZoom = device?.neutralZoom ?? 1;  // 1x zoom
```

---

## 4. Focus Kontrolü

### Tap-to-Focus
```tsx
const tapGesture = Gesture.Tap()
  .onEnd((event) => {
    if (device?.supportsFocus) {
      camera.current?.focus({ x: event.x, y: event.y });
    }
  });
```

### Focus Desteği Kontrolü
```tsx
if (device?.supportsFocus) {
  // Focus destekleniyor
}
```

---

## 5. Exposure Kontrolü

### Manuel Exposure
```tsx
<Camera
  {...props}
  exposure={-1}  // device.minExposure ile device.maxExposure arası
/>

// Exposure limitleri
const minExposure = device?.minExposure ?? -4;
const maxExposure = device?.maxExposure ?? 4;
```

### Animated Exposure
```tsx
const ReanimatedCamera = Animated.createAnimatedComponent(Camera);
Animated.addWhitelistedNativeProps({ exposure: true });

const exposureSlider = useSharedValue(0);

const exposureValue = useDerivedValue(() => {
  return interpolate(
    exposureSlider.value,
    [-1, 0, 1],
    [device.minExposure, 0, device.maxExposure]
  );
});

const animatedProps = useAnimatedProps(() => ({
  exposure: exposureValue.value
}));
```

---

## 6. Flash & Torch

### Flash (Fotoğraf için)
```tsx
const photo = await camera.current.takePhoto({
  flash: 'on'  // 'on' | 'off' | 'auto'
});
```

### Torch (Video/Preview için)
```tsx
<Camera
  {...props}
  torch="on"  // 'on' | 'off'
/>

// Torch desteği kontrolü
if (device?.hasTorch) {
  // Torch destekleniyor
}
```

---

## 7. Low Light Boost (Gece Modu)

```tsx
<Camera
  {...props}
  lowLightBoost={device?.supportsLowLightBoost}
/>
```

---

## 8. QR/Barcode Tarama (Bize lazım değil)

```tsx
import { useCodeScanner } from 'react-native-vision-camera';

const codeScanner = useCodeScanner({
  codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'pdf-417'],
  onCodeScanned: (codes, frame) => {
    for (const code of codes) {
      console.log('Code:', {
        type: code.type,
        value: code.value,
        corners: code.corners,
        frame: code.frame,
      });
    }
  },
});

<Camera
  device={device}
  isActive={true}
  codeScanner={codeScanner}
/>
```

### Desteklenen Kod Türleri
- `qr` - QR Code
- `ean-13` - EAN-13 Barcode
- `ean-8` - EAN-8 Barcode
- `code-128` - Code 128
- `code-39` - Code 39
- `pdf-417` - PDF417
- `aztec` - Aztec
- `data-matrix` - Data Matrix
- `upc-e` - UPC-E
- `upc-a` - UPC-A
- `itf` - ITF
- `codabar` - Codabar

---

## 9. Frame Processors

### Temel Kullanım
```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  const objects = detectObjects(frame);
  console.log(`Detected: ${objects[0]?.name}`);
}, []);

<Camera
  {...props}
  frameProcessor={frameProcessor}
/>
```

### Async Frame Processing
```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  
  runAsync(frame, () => {
    'worklet'
    // Ağır işlemler burada
    const faces = detectFaces(frame);
  });
}, []);
```

### Skia Frame Processor
```tsx
const frameProcessor = useSkiaFrameProcessor((frame) => {
  'worklet'
  frame.render();  // Zorunlu
  // Skia ile çizim yapabilirsin
}, []);
```

---

## 10. Device Seçimi

### Hooks API
```tsx
// Default back camera
const device = useCameraDevice('back');

// Front camera
const frontDevice = useCameraDevice('front');

// External camera (USB)
const externalDevice = useCameraDevice('external');

// Specific physical devices
const wideAngle = useCameraDevice('back', {
  physicalDevices: ['wide-angle-camera']
});

const telephoto = useCameraDevice('back', {
  physicalDevices: ['telephoto-camera']
});

const ultraWide = useCameraDevice('back', {
  physicalDevices: ['ultra-wide-angle-camera']
});

// Multi-camera (Triple)
const tripleCamera = useCameraDevice('back', {
  physicalDevices: [
    'ultra-wide-angle-camera',
    'wide-angle-camera',
    'telephoto-camera'
  ]
});
```

### Device Özellikleri
```tsx
console.log('Device:', {
  id: device.id,
  position: device.position,        // 'back' | 'front' | 'external'
  name: device.name,
  hasFlash: device.hasFlash,
  hasTorch: device.hasTorch,
  physicalDevices: device.physicalDevices,
  minZoom: device.minZoom,
  maxZoom: device.maxZoom,
  neutralZoom: device.neutralZoom,
  minExposure: device.minExposure,
  maxExposure: device.maxExposure,
  supportsLowLightBoost: device.supportsLowLightBoost,
  supportsRawCapture: device.supportsRawCapture,
  supportsFocus: device.supportsFocus,
  hardwareLevel: device.hardwareLevel,
});
```

---

## 11. Format Seçimi

```tsx
const format = useCameraFormat(device, [
  { videoAspectRatio: 16 / 9 },
  { videoResolution: { width: 1920, height: 1080 } },
  { photoResolution: 'max' },
  { fps: 60 },
  { videoHdr: true },
  { photoHdr: true },
  { videoStabilizationMode: 'cinematic' },
]);

<Camera
  {...props}
  format={format}
/>
```

### Slow Motion
```tsx
const slowMotionFormat = useCameraFormat(device, [
  { fps: 240 }  // 120, 240, 480 FPS
]);
```

---

## 12. Orientation & Mirror

### Output Orientation
```tsx
<Camera
  {...props}
  outputOrientation="device"  // 'device' | 'preview' | 'portrait' | 'landscape-left' | 'landscape-right' | 'portrait-upside-down'
  onOutputOrientationChanged={(orientation) => {
    console.log('Orientation:', orientation);
  }}
  onUIRotationChanged={(rotation) => {
    console.log('UI Rotation:', rotation);  // Derece
  }}
/>
```

### Mirror Mode
```tsx
<Camera
  {...props}
  isMirrored={true}  // Çıktıyı yatay çevir
/>
```

---

## 13. Preview Ayarları

### Resize Mode
```tsx
<Camera
  {...props}
  resizeMode="cover"  // 'cover' | 'contain'
/>
```

### Preview Devre Dışı
```tsx
<Camera
  {...props}
  preview={false}  // Kaynak tasarrufu
/>
```

---

## 14. Location Metadata

```tsx
import { useLocationPermission } from 'react-native-vision-camera';

const { hasPermission, requestPermission } = useLocationPermission();

<Camera
  {...props}
  enableLocation={hasPermission}  // Fotoğraf/video'ya GPS ekle
/>
```

---

## 15. Lifecycle Yönetimi

```tsx
import { useIsFocused } from '@react-navigation/native';
import { useAppState } from '@react-native-community/hooks';

function CameraScreen() {
  const isFocused = useIsFocused();
  const appState = useAppState();
  
  // Sadece ekran aktif ve app foreground'da ise kamera çalışsın
  const isActive = isFocused && appState === 'active';

  return (
    <Camera
      {...props}
      isActive={isActive}
    />
  );
}
```

---

## 16. Error Handling

```tsx
import { CameraRuntimeError, CameraCaptureError } from 'react-native-vision-camera';

<Camera
  {...props}
  onError={(error: CameraRuntimeError) => {
    switch (error.code) {
      case 'device/camera-not-available':
        console.error('Kamera mevcut değil');
        break;
      case 'device/camera-in-use-by-another-client':
        console.error('Kamera başka uygulama tarafından kullanılıyor');
        break;
      case 'permission/camera-permission-denied':
        console.error('Kamera izni reddedildi');
        break;
      case 'session/camera-cannot-be-opened':
        console.error('Kamera oturumu açılamadı');
        break;
      case 'capture/insufficient-storage':
        console.error('Yetersiz depolama alanı');
        break;
      case 'capture/recording-in-progress':
        console.error('Kayıt zaten devam ediyor');
        break;
      default:
        console.error('Bilinmeyen hata:', error.code);
    }
  }}
/>

// Capture hatası
try {
  const photo = await camera.current.takePhoto();
} catch (e) {
  if (e instanceof CameraCaptureError) {
    console.error('Capture error:', e.code, e.message);
  }
}
```

---

## 17. Permissions

### Hooks API
```tsx
import { 
  useCameraPermission, 
  useMicrophonePermission, 
  useLocationPermission 
} from 'react-native-vision-camera';

const camera = useCameraPermission();
const microphone = useMicrophonePermission();
const location = useLocationPermission();

// İzin kontrolü
if (!camera.hasPermission) {
  await camera.requestPermission();
}
```

### Imperative API
```tsx
import { Camera } from 'react-native-vision-camera';

// Status kontrolü
const cameraStatus = Camera.getCameraPermissionStatus();
const micStatus = Camera.getMicrophonePermissionStatus();
// 'granted' | 'not-determined' | 'denied' | 'restricted'

// İzin iste
const newCameraPermission = await Camera.requestCameraPermission();
const newMicPermission = await Camera.requestMicrophonePermission();
```

### Expo Config
```json
{
  "plugins": [
    [
      "react-native-vision-camera",
      {
        "cameraPermissionText": "$(PRODUCT_NAME) kameranıza erişmek istiyor.",
        "enableMicrophonePermission": true,
        "microphonePermissionText": "$(PRODUCT_NAME) mikrofonunuza erişmek istiyor."
      }
    ]
  ]
}
```
