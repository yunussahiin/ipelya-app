# Instagram Stories Library - Detaylı Mimari Analiz

## 📁 Klasör Yapısı

```
instagram-stories-src/
├── index.tsx                          # Ana export
├── core/
│   ├── constants/index.ts             # Sabitler (WIDTH, HEIGHT, COLORS, DURATIONS)
│   ├── dto/                           # TypeScript interfaces
│   │   ├── instagramStoriesDTO.ts    # Ana props ve types
│   │   ├── componentsDTO.ts          # Component props
│   │   └── helpersDTO.ts             # Helper types
│   └── helpers/storage.ts             # AsyncStorage yardımcıları
└── components/
    ├── InstagramStories/              # Ana component (wrapper)
    ├── Modal/                         # 🎬 Gesture + Animation logic
    │   ├── index.tsx                 # Ana modal component
    │   ├── gesture.tsx               # PanGestureHandler wrapper
    │   └── Modal.styles.ts
    ├── List/                          # Story list (horizontal scroll)
    │   ├── index.tsx                 # StoryAnimation wrapper
    │   └── List.styles.ts
    ├── Animation/                     # 🎯 3D Cube efekti
    │   ├── index.tsx                 # 3D transform logic
    │   └── Animation.styles.ts
    ├── Progress/                      # Progress bar
    │   ├── index.tsx                 # Container
    │   ├── item.tsx                  # Animated segment
    │   └── Progress.styles.ts
    ├── Content/                       # Story content renderer
    ├── Image/                         # Image + Video component
    │   ├── index.tsx
    │   └── video.tsx
    ├── Header/                        # Story header (avatar, name, time)
    ├── Footer/                        # Story footer (custom component)
    ├── AvatarList/                    # Avatar listesi (horizontal)
    ├── Avatar/                        # Avatar component
    ├── Loader/                        # Loading spinner
    ├── Icon/                          # Icons (close button)
    └── List/                          # Story list wrapper
```

## 🔄 Veri Akışı

```
InstagramStories (Main Component)
    ↓
    ├─→ StoryAvatarList (Horizontal avatars)
    │
    └─→ Modal (Gesture handler)
        ↓
        ├─→ GestureHandler (PanGestureHandler)
        │   ↓
        │   └─→ StoryList (Animated.View)
        │       ↓
        │       └─→ StoryAnimation (3D Cube)
        │           ↓
        │           └─→ StoryImage (Image/Video)
        │
        ├─→ Progress (Segment bar)
        ├─→ StoryHeader
        ├─→ StoryContent (Custom render)
        └─→ StoryFooter
```

## 🎬 Animasyon Sistemi

### 1. **Shared Values (State)**
```typescript
const x = useSharedValue(0);                    // Horizontal scroll position
const y = useSharedValue(HEIGHT);               // Vertical position (for close)
const animation = useSharedValue(0);            // Progress (0-1)
const currentStory = useSharedValue(storyId);   // Current story ID
const paused = useSharedValue(false);           // Pause state
```

### 2. **3D Cube Efekti** (Animation/index.tsx)
```typescript
const angle = Math.PI / 3;  // 60 derece

const rotateY = interpolate(
  x.value,
  [offset - WIDTH, offset + WIDTH],
  [angle, -angle],
  Extrapolation.CLAMP
);

// Transform:
transform: [
  { perspective: WIDTH },
  { translateX },
  { rotateY: `${rotateY}rad` },
  { translateX: translateX1 },
]
```

**Sonuç:** Sola/sağa kaydırırken 3D cube rotasyonu

### 3. **Progress Bar** (Progress/item.tsx)
```typescript
// Animated width:
if (activeStory.value < index) {
  return { width: 0 };  // Gelecek
} else if (activeStory.value > index) {
  return { width };     // Tamamlanmış
} else {
  return { width: width * progress.value };  // Aktif (0-1)
}
```

### 4. **Modal Animasyonu** (Modal/index.tsx)
```typescript
// Açılış:
y.value = 0;  // Top: 0

// Kapanış:
y.value = withTiming(HEIGHT, { duration: modalAnimationDuration });

// Opacity:
opacity: interpolate(y.value, [0, HEIGHT], [1, 0])
```

## 🎮 Gesture Handling

### Pan Gesture (Modal/index.tsx)
```typescript
const onGestureEvent = useAnimatedGestureHandler({
  onStart: () => {
    stopAnimation();
  },
  onActive: (event) => {
    x.value = event.translationX;  // Horizontal swipe
    y.value = event.translationY;  // Vertical swipe (close)
  },
  onEnd: (event) => {
    // Snap to nearest user
    // Or close if swiped down
  }
});
```

## 📊 State Management

### Derived Values
```typescript
const userIndex = useDerivedValue(() => Math.round(x.value / WIDTH));
const storyIndex = useDerivedValue(() => 
  stories[userIndex.value]?.stories.findIndex(...)
);
const userId = useDerivedValue(() => stories[userIndex.value]?.id);
```

### Animated Reactions
```typescript
useAnimatedReaction(
  () => activeStory.value,
  (res, prev) => res !== prev && onChange(),
  [activeStory.value, onChange]
);
```

## 🔑 Önemli Konseptler

### 1. **Worklet Direktifi**
```typescript
const onClose = () => {
  'worklet';  // Bu fonksiyon UI thread'de çalışır
  y.value = withTiming(HEIGHT, ...);
};
```

### 2. **runOnJS**
```typescript
runOnJS(setVisible)(false);  // JS thread'de state update
```

### 3. **useDerivedValue**
```typescript
// Computed value (reactive)
const userIndex = useDerivedValue(() => Math.round(x.value / WIDTH));
```

### 4. **useAnimatedReaction**
```typescript
// Watch for changes
useAnimatedReaction(
  () => activeStory.value,
  (res, prev) => res !== prev && onChange()
);
```

## 💾 Storage Integration

```typescript
// Progress kaydı
const seenStories = await getProgressStorage();
await setProgressStorage(userId, storyId);

// AsyncStorage'da format:
{
  "user1": "story3",  // Son görülen story
  "user2": "story1"
}
```

## 🎯 Bizim Sistemimize Uygulanacaklar

### ✅ Alınacak
1. **3D Cube animasyon** - `interpolate` + `perspective`
2. **Progress bar** - Animated width
3. **Gesture handling** - Pan gesture logic
4. **Derived values** - Reactive state
5. **Worklet pattern** - UI thread optimization

### ⚠️ Farklılıklar
- Bizim: Modal + StoryViewer (ayrı)
- Onların: InstagramStories (tümü bir component)
- Bizim: Tepki sistemi var
- Onların: Tepki sistemi yok
- Bizim: Insights sheet var
- Onların: Custom footer var

## 📝 Entegrasyon Planı

1. **Animation/index.tsx** → Bizim `StoryViewer`'a 3D cube ekle
2. **Progress/item.tsx** → Bizim `StoryProgressBar`'ı iyileştir
3. **Modal gesture logic** → Bizim swipe gesture'ı düzelt
4. **Derived values** → State management'ı optimize et
