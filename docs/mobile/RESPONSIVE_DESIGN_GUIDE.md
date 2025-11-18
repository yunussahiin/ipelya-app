---
title: İPELYA Mobil - Responsive Design Guide
description: Tüm cihazlara uyum sağlayan responsive layout sistemi
---

# 📱 İPELYA Mobil - Responsive Design Guide

**Versiyon**: 1.0.0  
**Kaynak**: Context7 Research + React Native Best Practices  
**Durum**: ✅ Production Ready

---

## 🎯 Responsive Design Stratejisi

### **Cihaz Kategorileri**

```typescript
// Breakpoints (width-based)
const breakpoints = {
  xs: 0,        // Extra small (phones < 375px)
  sm: 375,      // Small (compact phones: iPhone SE, etc.)
  md: 414,      // Medium (standard phones: iPhone 12, 13)
  lg: 768,      // Large (tablets: iPad mini)
  xl: 1024      // Extra large (tablets: iPad Pro)
};

// Device Types
const deviceTypes = {
  phone: { min: 0, max: 600 },
  tablet: { min: 600, max: Infinity }
};
```

### **Cihaz Örnekleri**

| Device             | Width  | Category | Handling        |
| ------------------ | ------ | -------- | --------------- |
| **iPhone SE**      | 375px  | xs       | Compact layout  |
| **iPhone 12/13**   | 390px  | sm       | Standard layout |
| **iPhone 14/15**   | 393px  | md       | Standard layout |
| **iPhone 14 Plus** | 430px  | md       | Standard layout |
| **iPad Mini**      | 768px  | lg       | Tablet layout   |
| **iPad Air**       | 820px  | lg       | Tablet layout   |
| **iPad Pro 11"**   | 834px  | lg       | Tablet layout   |
| **iPad Pro 12.9"** | 1024px | xl       | Large tablet    |

---

## 🔧 Responsive Implementation

### **1. useWindowDimensions Hook (Recommended)**

```typescript
import { useWindowDimensions } from 'react-native';

export function ResponsiveComponent() {
  const { width, height, scale, fontScale } = useWindowDimensions();
  
  // Responsive values
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;
  const padding = isTablet ? 32 : 16;
  const fontSize = isSmallPhone ? 14 : 16;
  
  return (
    <View style={{ padding, paddingTop: height * 0.1 }}>
      <Text style={{ fontSize }}>Responsive Text</Text>
    </View>
  );
}
```

**Avantajlar**:
- ✅ Orientation changes otomatik detect
- ✅ Font scaling support
- ✅ Real-time updates
- ✅ Performant

### **2. Dimensions API (Alternative)**

```typescript
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Orientation change listener
const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
  console.log('Window:', window.width, window.height);
  console.log('Screen:', screen.width, screen.height);
});

// Cleanup
subscription.remove();
```

### **3. Safe Area Handling**

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SafeAreaComponent() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{
      paddingTop: Math.max(insets.top, 16),
      paddingBottom: Math.max(insets.bottom, 16),
      paddingLeft: Math.max(insets.left, 16),
      paddingRight: Math.max(insets.right, 16)
    }}>
      {/* Content */}
    </View>
  );
}
```

---

## 📐 Responsive Padding System

### **Device-Based Padding**

```typescript
import { useWindowDimensions } from 'react-native';
import { LAYOUT_CONSTANTS } from '@/theme/layout';

export function getResponsivePadding(width: number) {
  if (width < 375) {
    // Extra small phones
    return {
      horizontal: 12,
      vertical: 8,
      top: 16,
      bottom: 24
    };
  } else if (width < 414) {
    // Small phones
    return {
      horizontal: 16,
      vertical: 12,
      top: 24,
      bottom: 32
    };
  } else if (width < 768) {
    // Medium phones
    return {
      horizontal: 16,
      vertical: 12,
      top: 24,
      bottom: 32
    };
  } else {
    // Tablets
    return {
      horizontal: 32,
      vertical: 16,
      top: 32,
      bottom: 48
    };
  }
}

// Usage
export function ResponsiveLayout() {
  const { width } = useWindowDimensions();
  const padding = getResponsivePadding(width);
  
  return (
    <View style={{
      paddingHorizontal: padding.horizontal,
      paddingTop: padding.top,
      paddingBottom: padding.bottom
    }}>
      {/* Content */}
    </View>
  );
}
```

---

## 🎬 Responsive Font Sizes

### **Dynamic Font Scaling**

```typescript
import { useWindowDimensions } from 'react-native';

export function getResponsiveFontSize(width: number, baseSize: number) {
  if (width < 375) {
    return baseSize * 0.9;  // 90% on small phones
  } else if (width < 414) {
    return baseSize * 0.95; // 95% on compact phones
  } else if (width < 768) {
    return baseSize;        // 100% on standard phones
  } else {
    return baseSize * 1.2;  // 120% on tablets
  }
}

// Usage
export function ResponsiveText() {
  const { width } = useWindowDimensions();
  const fontSize = getResponsiveFontSize(width, 16);
  
  return <Text style={{ fontSize }}>Responsive Text</Text>;
}
```

### **Font Scale Property**

```typescript
import { useWindowDimensions } from 'react-native';

export function AccessibleText() {
  const { fontScale } = useWindowDimensions();
  
  // Respect user's font size preference
  const fontSize = 16 * fontScale;
  
  return (
    <Text 
      style={{ fontSize }}
      maxFontSizeMultiplier={1.3}  // Cap at 130%
    >
      Accessible Text
    </Text>
  );
}
```

---

## 🎨 Responsive Layout Patterns

### **Pattern 1: Single Column (Phones)**

```typescript
// < 768px width
<View style={{ flex: 1 }}>
  <View style={{ flex: 1, padding: 16 }}>
    {/* Header */}
  </View>
  <View style={{ flex: 2, padding: 16 }}>
    {/* Content */}
  </View>
  <View style={{ flex: 1, padding: 16 }}>
    {/* Footer */}
  </View>
</View>
```

### **Pattern 2: Two Column (Tablets)**

```typescript
// >= 768px width
<View style={{ flex: 1, flexDirection: 'row' }}>
  <View style={{ flex: 1, padding: 32 }}>
    {/* Sidebar */}
  </View>
  <View style={{ flex: 2, padding: 32 }}>
    {/* Main Content */}
  </View>
</View>
```

### **Pattern 3: Adaptive Grid**

```typescript
import { useWindowDimensions } from 'react-native';

export function ResponsiveGrid() {
  const { width } = useWindowDimensions();
  
  const numColumns = width < 414 ? 2 : width < 768 ? 3 : 4;
  const itemSize = (width - 32) / numColumns;
  
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 16 }}>
      {items.map((item) => (
        <View key={item.id} style={{ width: itemSize, height: itemSize }}>
          {/* Item */}
        </View>
      ))}
    </View>
  );
}
```

---

## 🔐 Safe Area Integration

### **Complete Safe Area Setup**

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Root Layout
export function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView 
        style={{ flex: 1 }}
        edges={["top", "bottom", "left", "right"]}
      >
        <App />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Component Usage
export function MyComponent() {
  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
    >
      {/* Content */}
    </ScrollView>
  );
}
```

### **Safe Area Modes**

```typescript
// Mode 1: Padding (default)
<SafeAreaView mode="padding" edges={["top", "bottom"]}>
  {/* Insets applied as padding */}
</SafeAreaView>

// Mode 2: Margin
<SafeAreaView mode="margin" edges={["top", "bottom"]}>
  {/* Insets applied as margin */}
</SafeAreaView>

// Mode 3: Maximum (for floating elements)
<SafeAreaView 
  edges={{ bottom: 'maximum' }}
  style={{ paddingBottom: 24 }}
>
  {/* Ensures minimum 24px or safe area, whichever is greater */}
</SafeAreaView>
```

---

## 📊 Responsive Component Hook

### **useResponsive Hook**

```typescript
// src/hooks/useResponsive.ts

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useResponsive() {
  const { width, height, scale, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Device classification
  const isSmallPhone = width < 375;
  const isPhone = width < 768;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  
  // Responsive values
  const padding = isTablet ? 32 : 16;
  const gap = isTablet ? 24 : 16;
  const fontSize = isSmallPhone ? 14 : 16;
  const numColumns = isSmallPhone ? 2 : isPhone ? 3 : 4;
  
  return {
    // Dimensions
    width,
    height,
    scale,
    fontScale,
    
    // Safe area
    insets,
    
    // Classification
    isSmallPhone,
    isPhone,
    isTablet,
    isLargeTablet,
    
    // Responsive values
    padding,
    gap,
    fontSize,
    numColumns,
    
    // Helpers
    isLandscape: width > height,
    isPortrait: height > width
  };
}

// Usage
export function MyComponent() {
  const {
    isTablet,
    padding,
    insets,
    numColumns
  } = useResponsive();
  
  return (
    <View style={{
      padding,
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }}>
      {/* Content */}
    </View>
  );
}
```

---

## 🎯 Responsive Layout Constants

```typescript
// src/theme/responsive.ts

import { useWindowDimensions } from 'react-native';

export const RESPONSIVE_BREAKPOINTS = {
  xs: 0,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024
} as const;

export const RESPONSIVE_PADDING = {
  xs: { h: 12, v: 8 },
  sm: { h: 16, v: 12 },
  md: { h: 16, v: 12 },
  lg: { h: 32, v: 16 },
  xl: { h: 40, v: 20 }
} as const;

export const RESPONSIVE_FONT_SIZE = {
  xs: { base: 14, lg: 28 },
  sm: { base: 15, lg: 30 },
  md: { base: 16, lg: 32 },
  lg: { base: 18, lg: 36 },
  xl: { base: 20, lg: 40 }
} as const;

export function getBreakpoint(width: number) {
  if (width < 375) return 'xs';
  if (width < 414) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
}
```

---

## ✅ Testing Responsive Design

### **Test Devices**

```typescript
// Test on these devices
const testDevices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 14 Plus', width: 430, height: 932 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Air', width: 820, height: 1180 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366 }
];
```

### **Orientation Testing**

```typescript
// Test both orientations
const orientations = [
  { name: 'Portrait', width: 390, height: 844 },
  { name: 'Landscape', width: 844, height: 390 }
];
```

---

## 🚀 Best Practices

### **DO's ✅**

- ✅ Use `useWindowDimensions` for responsive values
- ✅ Wrap app with `SafeAreaProvider`
- ✅ Use `SafeAreaView` for all screens
- ✅ Test on multiple device sizes
- ✅ Support both orientations
- ✅ Use percentage widths when possible
- ✅ Respect user font scale preferences
- ✅ Use flex layout for responsiveness

### **DON'Ts ❌**

- ❌ Hardcode pixel values
- ❌ Ignore safe areas
- ❌ Forget about notches/home indicators
- ❌ Test only on one device size
- ❌ Use fixed heights for dynamic content
- ❌ Ignore landscape orientation
- ❌ Disable font scaling
- ❌ Use absolute positioning for layouts

---

## 📋 Responsive Checklist

- [ ] All screens use `SafeAreaView`
- [ ] Padding responsive (16px phone, 32px tablet)
- [ ] Font sizes scale with device
- [ ] Tested on small phones (375px)
- [ ] Tested on large phones (430px)
- [ ] Tested on tablets (768px+)
- [ ] Orientation changes handled
- [ ] Safe area insets respected
- [ ] No hardcoded pixel values
- [ ] Font scale respected

---

## 🔗 Related Files

- `src/theme/layout.ts` - Layout constants
- `src/hooks/useResponsive.ts` - Responsive hook
- `src/components/layout/PageScreen.tsx` - Main layout
- `src/theme/ThemeProvider.tsx` - Theme provider

---

**Responsive design sistemi hazır! 🎨**
