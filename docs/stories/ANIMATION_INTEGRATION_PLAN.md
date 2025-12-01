# Story Animasyonları Entegrasyon Planı

## 🎬 Tespit Edilen Animasyonlar

### 1. **3D Cube Efekti** (Animation/index.tsx)
```typescript
const angle = Math.PI / 3;  // 60 derece
const ratio = Platform.OS === 'ios' ? 2 : 1.2;

// Transform hesaplamaları:
const translateX = interpolate(x.value, inputRange, [WIDTH/ratio, -WIDTH/ratio], Extrapolation.CLAMP);
const rotateY = interpolate(x.value, inputRange, [angle, -angle], Extrapolation.CLAMP);

// 3D Transform:
transform: [
  { perspective: WIDTH },
  { translateX },
  { rotateY: `${rotateY}rad` },
  { translateX: translateX1 },  // Ek offset
]

// Mask (karartma efekti):
opacity: interpolate(x.value, maskInputRange, [0.5, 0, 0.5], Extrapolation.CLAMP)
```

### 2. **Modal Açılış/Kapanış** (Modal/index.tsx)
```typescript
// Açılış:
y.value = withTiming(0, { duration: modalAnimationDuration });  // 800ms

// Kapanış:
y.value = withTiming(HEIGHT, { duration: modalAnimationDuration });

// Background opacity:
opacity: interpolate(y.value, [0, HEIGHT], [1, 0])
```

### 3. **Gesture Handling** (Modal/index.tsx)
```typescript
onGestureEvent = useAnimatedGestureHandler({
  onStart: (e, ctx) => {
    ctx.x = x.value;
    ctx.userId = userId.value;
    paused.value = true;
  },
  onActive: (e, ctx) => {
    // Dikey swipe (kapatma)
    if (ctx.vertical || Math.abs(e.velocityX) < Math.abs(e.velocityY)) {
      ctx.vertical = true;
      y.value = e.translationY / 2;  // Yarı hızda takip
    } 
    // Yatay swipe (kullanıcı değiştirme)
    else {
      ctx.moving = true;
      x.value = Math.max(0, Math.min(ctx.x + -e.translationX, WIDTH * (stories.length - 1)));
    }
  },
  onFinish: (e, ctx) => {
    // Dikey swipe bitti
    if (ctx.vertical) {
      if (e.translationY > 100) {
        onClose();  // Kapat
      } else if (e.translationY < -100) {
        onSwipeUp();  // Yukarı swipe callback
      } else {
        y.value = withTiming(0);  // Geri dön
        startAnimation(true);
      }
    }
    // Yatay swipe bitti
    else if (ctx.moving) {
      const diff = x.value - ctx.x;
      let newX;
      
      // Threshold: WIDTH / 4
      if (Math.abs(diff) < WIDTH / 4) {
        newX = ctx.x;  // Geri dön
      } else {
        newX = diff > 0 
          ? Math.ceil(x.value / WIDTH) * WIDTH 
          : Math.floor(x.value / WIDTH) * WIDTH;
      }
      
      scrollTo(newUserId, true, ...);
    }
  }
});
```

### 4. **Story Geçiş Animasyonu** (Modal/index.tsx)
```typescript
const scrollTo = (id, animated = true, ...) => {
  const newUserIndex = stories.findIndex(story => story.id === id);
  const newX = newUserIndex * WIDTH;
  
  x.value = animated 
    ? withTiming(newX, { duration: storyAnimationDuration })  // 800ms
    : newX;
};
```

### 5. **Progress Bar Animasyonu** (Progress/item.tsx)
```typescript
const animatedStyle = useAnimatedStyle(() => {
  if (!active.value || activeStory.value < index) {
    return { width: 0 };  // Gelecek story
  }
  if (activeStory.value > index) {
    return { width };  // Tamamlanmış
  }
  return { width: width * progress.value };  // Aktif (0-1)
});
```

### 6. **Long Press Pause** (Modal/index.tsx)
```typescript
const onPressIn = () => {
  stopAnimation();
  paused.value = true;
};

const onLongPress = () => {
  isLongPress.value = true;
  hideElements.value = hideElementsOnLongPress ?? false;
};

const onPressOut = () => {
  hideElements.value = false;
  isLongPress.value = false;
  paused.value = false;
  startAnimation(true);
};
```

### 7. **Tap Navigation** (Modal/index.tsx)
```typescript
const onPress = ({ nativeEvent: { locationX } }) => {
  if (locationX < WIDTH / 2) {
    toPreviousStory();  // Sol yarı = önceki
  } else {
    toNextStory();  // Sağ yarı = sonraki
  }
};
```

## 📊 Sabitler

```typescript
// Animasyon süreleri
const STORY_ANIMATION_DURATION = 800;   // Story geçiş animasyonu
const ANIMATION_DURATION = 10000;       // Story süresi (10 saniye)
const LONG_PRESS_DURATION = 500;        // Long press threshold

// Renkler
const PROGRESS_COLOR = '#00000099';
const PROGRESS_ACTIVE_COLOR = '#FFFFFF';
const BACKGROUND_COLOR = '#000000';

// Boyutlar
const AVATAR_SIZE = 60;
const STORY_AVATAR_SIZE = 26;
```

## 🔧 Bizim StoryViewer'a Entegrasyon

### Değişiklikler:

1. **Shared Values ekle:**
   - `x` - Yatay scroll pozisyonu
   - `y` - Dikey pozisyon (kapatma için)
   - `animation` - Progress (0-1)

2. **3D Cube animasyonu ekle:**
   - `StoryAnimation` component'i oluştur
   - `interpolate` ile 3D transform hesapla

3. **Gesture handler güncelle:**
   - `useAnimatedGestureHandler` kullan
   - Context ile state yönet
   - Threshold-based action

4. **Progress bar güncelle:**
   - `useAnimatedStyle` ile width animasyonu
   - Segment bazlı görünüm

5. **Modal animasyonu ekle:**
   - Açılış: `y.value = withTiming(0)`
   - Kapanış: `y.value = withTiming(HEIGHT)`
   - Background opacity

## ✅ Entegrasyon Sırası

1. [ ] Constants dosyası oluştur
2. [ ] Shared values ekle
3. [ ] 3D Cube animasyonu ekle
4. [ ] Gesture handler güncelle
5. [ ] Progress bar güncelle
6. [ ] Modal animasyonu ekle
7. [ ] Test et
