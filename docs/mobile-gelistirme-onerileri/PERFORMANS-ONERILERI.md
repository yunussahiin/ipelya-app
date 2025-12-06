# ⚡ Performans Önerileri

Bu dokümanda mobil uygulamanın performansını artırmak için öneriler yer almaktadır.

---

## 1. Liste Performansı

### Mevcut Durum
`@shopify/flash-list` kurulu ancak tüm listelerde kullanılmıyor olabilir.

### Öneri: FlashList Kullanımını Genişlet

```typescript
// ❌ FlatList (yavaş)
import { FlatList } from "react-native";

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>

// ✅ FlashList (hızlı)
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={100} // Önemli!
/>
```

### FlashList Best Practices

```typescript
<FlashList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={100}
  
  // Performans optimizasyonları
  drawDistance={250}
  overrideItemLayout={(layout, item) => {
    layout.size = item.type === "header" ? 60 : 100;
  }}
  
  // Recycling
  getItemType={(item) => item.type}
  
  // Callbacks
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  
  // Görsel
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 100 }}
/>
```

---

## 2. Image Optimization

### Mevcut Durum
`expo-image` kullanılıyor ancak cache policy ve placeholder optimize edilmeli.

### Öneri: Image Component Wrapper

```typescript
// src/components/ui/OptimizedImage.tsx
import { Image, ImageProps } from "expo-image";
import { StyleSheet } from "react-native";

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  uri: string;
  blurhash?: string;
  priority?: "low" | "normal" | "high";
}

// Varsayılan blurhash (gri placeholder)
const DEFAULT_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function OptimizedImage({
  uri,
  blurhash = DEFAULT_BLURHASH,
  priority = "normal",
  style,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      source={{ uri }}
      placeholder={{ blurhash }}
      cachePolicy="memory-disk"
      transition={200}
      priority={priority}
      recyclingKey={uri}
      style={[styles.image, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#1a1a1a"
  }
});
```

### Avatar Component

```typescript
// src/components/ui/Avatar.tsx
import { OptimizedImage } from "./OptimizedImage";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const { colors } = useTheme();

  if (!uri) {
    const initial = name?.charAt(0).toUpperCase() ?? "?";
    return (
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.accent
          }
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <OptimizedImage
      uri={uri}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2
      }}
      priority="high"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center"
  },
  initial: {
    color: "#fff",
    fontWeight: "700"
  }
});
```

---

## 3. React Query Optimization

### Mevcut Durum
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      gcTime: 1000 * 60 * 10   // 10 dakika
    }
  }
});
```

### Öneri: Endpoint Bazlı Cache Stratejisi

```typescript
// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Varsayılan ayarlar
      staleTime: 5 * 60 * 1000,      // 5 dakika
      gcTime: 10 * 60 * 1000,        // 10 dakika
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Mobile için önemli
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // Network durumuna göre
      networkMode: "offlineFirst"
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst"
    }
  }
});

// Query key factory
export const queryKeys = {
  // User
  user: (id: string) => ["user", id] as const,
  userProfile: (id: string) => ["user", id, "profile"] as const,
  
  // Feed
  feed: () => ["feed"] as const,
  feedPage: (page: number) => ["feed", "page", page] as const,
  
  // Messages
  conversations: () => ["conversations"] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  
  // Notifications
  notifications: () => ["notifications"] as const,
  unreadCount: () => ["notifications", "unread"] as const
} as const;
```

### Query Hooks Pattern

```typescript
// src/hooks/useUserProfile.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { queryKeys } from "@/lib/queryClient";

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 dakika (profil sık değişmez)
    enabled: !!userId
  });
}
```

---

## 4. Memoization

### Component Memoization

```typescript
import { memo, useMemo, useCallback } from "react";

// ❌ Her render'da yeni component
function ListItem({ item, onPress }) {
  return (
    <Pressable onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </Pressable>
  );
}

// ✅ Memoized component
const ListItem = memo(function ListItem({ 
  item, 
  onPress 
}: { 
  item: Item; 
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <Text>{item.title}</Text>
    </Pressable>
  );
});
```

### Expensive Calculations

```typescript
// ❌ Her render'da hesaplama
function ExpensiveComponent({ items }) {
  const sortedItems = items.sort((a, b) => b.score - a.score);
  const topItems = sortedItems.slice(0, 10);
  
  return <List items={topItems} />;
}

// ✅ Memoized hesaplama
function ExpensiveComponent({ items }) {
  const topItems = useMemo(() => {
    return [...items]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [items]);
  
  return <List items={topItems} />;
}
```

---

## 5. Bundle Size Optimization

### Analyze Bundle

```bash
# Bundle analizi
npx expo export --platform ios --dev false
npx source-map-explorer dist/bundles/ios-*.js
```

### Dynamic Imports

```typescript
// ❌ Eager import (bundle'a dahil)
import { VisionCamera } from "@/components/camera/VisionCamera";

// ✅ Lazy import (gerektiğinde yükle)
import { lazy, Suspense } from "react";

const VisionCamera = lazy(() => 
  import("@/components/camera/VisionCamera").then(m => ({ default: m.VisionCamera }))
);

function CameraScreen() {
  return (
    <Suspense fallback={<CameraSkeleton />}>
      <VisionCamera />
    </Suspense>
  );
}
```

### Tree Shaking

```typescript
// ❌ Tüm modülü import et
import * as Haptics from "expo-haptics";
Haptics.selectionAsync();

// ✅ Sadece kullanılanı import et
import { selectionAsync } from "expo-haptics";
selectionAsync();
```

---

## 6. Animation Performance

### Reanimated Best Practices

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from "react-native-reanimated";

function AnimatedCard() {
  const scale = useSharedValue(1);
  
  // ✅ UI thread'de çalışır
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const handlePress = () => {
    scale.value = withSpring(0.95, {}, (finished) => {
      if (finished) {
        scale.value = withSpring(1);
      }
    });
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress}>
        <Text>Card</Text>
      </Pressable>
    </Animated.View>
  );
}
```

### Gesture Handler Optimization

```typescript
import { Gesture, GestureDetector } from "react-native-gesture-handler";

function SwipeableCard() {
  const translateX = useSharedValue(0);
  
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));
  
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <Text>Swipe me</Text>
      </Animated.View>
    </GestureDetector>
  );
}
```

---

## 7. Memory Management

### Cleanup Effects

```typescript
// ❌ Memory leak riski
useEffect(() => {
  const subscription = someService.subscribe(handleData);
  // Cleanup yok!
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const subscription = someService.subscribe(handleData);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Avoid Closures in Loops

```typescript
// ❌ Her item için yeni closure
{items.map((item) => (
  <Pressable onPress={() => handlePress(item.id)}>
    <Text>{item.title}</Text>
  </Pressable>
))}

// ✅ Memoized handler
const handleItemPress = useCallback((id: string) => {
  // handle press
}, []);

{items.map((item) => (
  <ListItem 
    key={item.id}
    item={item}
    onPress={handleItemPress}
  />
))}
```

---

## 8. Network Optimization

### Request Batching

```typescript
// ❌ Çoklu request
const user = await fetchUser(userId);
const posts = await fetchPosts(userId);
const followers = await fetchFollowers(userId);

// ✅ Parallel requests
const [user, posts, followers] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchFollowers(userId)
]);
```

### Debounce Search

```typescript
import { useDebouncedCallback } from "use-debounce";

function SearchInput() {
  const [query, setQuery] = useState("");
  
  const debouncedSearch = useDebouncedCallback((value: string) => {
    performSearch(value);
  }, 300);
  
  const handleChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };
  
  return <TextInput value={query} onChangeText={handleChange} />;
}
```

---

## Performans Checklist

### Render Performance
- [ ] FlashList kullan (FlatList yerine)
- [ ] Component'leri memo ile sar
- [ ] useMemo/useCallback kullan
- [ ] Gereksiz re-render'ları önle

### Image Performance
- [ ] expo-image kullan
- [ ] cachePolicy="memory-disk" ayarla
- [ ] Blurhash placeholder kullan
- [ ] Uygun boyutlarda image yükle

### Network Performance
- [ ] React Query cache optimize et
- [ ] Request batching uygula
- [ ] Debounce/throttle kullan
- [ ] Offline support ekle

### Bundle Performance
- [ ] Dynamic imports kullan
- [ ] Tree shaking kontrol et
- [ ] Bundle size analiz et
- [ ] Gereksiz dependency'leri kaldır

### Animation Performance
- [ ] Reanimated kullan (Animated yerine)
- [ ] UI thread'de animasyon yap
- [ ] useNativeDriver: true kullan
- [ ] Layout animations optimize et

---

**Sonraki:** [MIMARI-ONERILERI.md](./MIMARI-ONERILERI.md)
