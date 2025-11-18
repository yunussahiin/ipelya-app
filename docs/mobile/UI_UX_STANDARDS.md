---
title: İPELYA Mobil - UI/UX Standartları
description: Tasarım sistemi, renk şeması, typography, spacing ve component standartları
---

# 🎨 İPELYA Mobil - UI/UX Standartları

**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready  
**Son Güncelleme**: 18 Kasım 2025

---

## 🎯 Tasarım Felsefesi

- **Modern & Minimal**: Temiz, odaklanmış UI
- **Accessibility First**: WCAG 2.1 AA uyumlu
- **Performance**: Smooth animations, optimized rendering
- **Adaptive**: Light/Dark mode + 3 accent color
- **Consistency**: Unified design language

---

## 🌈 Renk Şeması

### **Dark Mode (Default)**

```typescript
const darkPalette = {
  // Backgrounds
  background: "#050505",           // Pure black
  backgroundRaised: "#0a0a0a",     // Slightly raised
  surface: "#0f0f12",              // Card surface
  surfaceAlt: "#111111",           // Alternative surface
  
  // Borders
  border: "#1f1f20",               // Primary border
  borderMuted: "#262626",          // Muted border
  
  // Text
  textPrimary: "#ffffff",          // Main text
  textSecondary: "#a1a1aa",        // Secondary text
  textMuted: "#6b7280",            // Muted text
  
  // Accents (Magenta default)
  accent: "#ff3b81",               // Primary accent
  accentSoft: "#ff63c0",           // Soft accent
  highlight: "#a78bfa",            // Highlight
  
  // Status
  success: "#22c55e",              // Success green
  warning: "#fbbf24",              // Warning amber
  
  // Navigation
  navIndicator: "#ff63c0",         // iOS nav indicator
  navIndicatorAndroid: "#ff3b81",  // Android nav indicator
  navShadow: "rgba(0,0,0,0.45)",
  navBackground: "rgba(14,14,16,0.9)",
  navBorder: "rgba(255,255,255,0.05)"
};
```

### **Light Mode**

```typescript
const lightPalette = {
  // Backgrounds
  background: "#f8f8fb",           // Light gray
  backgroundRaised: "#ffffff",     // White
  surface: "#ffffff",              // Card surface
  surfaceAlt: "#f4f4f5",           // Alternative surface
  
  // Borders
  border: "#e4e4e7",               // Primary border
  borderMuted: "#d4d4d8",          // Muted border
  
  // Text
  textPrimary: "#0f172a",          // Dark text
  textSecondary: "#475569",        // Secondary text
  textMuted: "#94a3b8",            // Muted text
  
  // Accents (Magenta default)
  accent: "#d946ef",               // Primary accent
  accentSoft: "#f472b6",           // Soft accent
  highlight: "#7c3aed",            // Highlight
  
  // Status
  success: "#16a34a",              // Success green
  warning: "#d97706",              // Warning amber
  
  // Navigation
  navIndicator: "#db2777",         // iOS nav indicator
  navIndicatorAndroid: "#be185d",  // Android nav indicator
  navShadow: "rgba(15,23,42,0.15)",
  navBackground: "rgba(255,255,255,0.88)",
  navBorder: "rgba(15,23,42,0.08)"
};
```

### **Accent Colors (3 Seçenek)**

| Accent      | Dark    | Light   | Kullanım          |
| ----------- | ------- | ------- | ----------------- |
| **Magenta** | #ff3b81 | #d946ef | Default, romantic |
| **Aqua**    | #22d3ee | #0ea5e9 | Cool, modern      |
| **Amber**   | #fbbf24 | #f97316 | Warm, energetic   |

---

## 📐 Typography

### **Font Family**
```typescript
// System fonts (platform-specific)
fontFamily: {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System'
}

// Font weights
fontWeight: {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
}
```

### **Font Sizes**

| Size     | Value | Usage            |
| -------- | ----- | ---------------- |
| **xs**   | 12px  | Labels, captions |
| **sm**   | 14px  | Secondary text   |
| **base** | 16px  | Body text        |
| **lg**   | 18px  | Subheadings      |
| **xl**   | 20px  | Headings         |
| **2xl**  | 24px  | Large headings   |
| **3xl**  | 32px  | Hero text        |

### **Line Heights**

| Type        | Value |
| ----------- | ----- |
| **Tight**   | 1.2   |
| **Normal**  | 1.5   |
| **Relaxed** | 1.75  |

---

## 📏 Spacing System

**Base Unit**: 4px

```typescript
const spacing = {
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 12,     // 12px
  lg: 16,     // 16px
  xl: 24,     // 24px
  2xl: 32,    // 32px
  3xl: 48,    // 48px
  4xl: 64     // 64px
};
```

### **Kullanım Örnekleri**
- **xs (4px)**: Minimal gaps, icon spacing
- **sm (8px)**: Small gaps, tight layouts
- **md (12px)**: Form field gaps
- **lg (16px)**: Section padding, standard gap
- **xl (24px)**: Major sections, card padding
- **2xl (32px)**: Screen padding, large gaps
- **3xl (48px)**: Hero sections
- **4xl (64px)**: Screen top padding

---

## 🔲 Border Radius

```typescript
const borderRadius = {
  none: 0,
  sm: 4,      // 4px
  md: 8,      // 8px
  lg: 12,     // 12px
  xl: 16,     // 16px
  2xl: 20,    // 20px
  3xl: 24,    // 24px
  full: 9999  // Pill shape
};
```

### **Kullanım**
- **sm (4px)**: Subtle corners
- **md (8px)**: Input fields
- **lg (12px)**: Buttons
- **xl (16px)**: Cards
- **2xl (20px)**: Large cards
- **3xl (24px)**: Hero sections
- **full**: Pill buttons, avatars

---

## 🎬 Animations

### **Duration**

```typescript
const duration = {
  fast: 150,      // 150ms - Quick feedback
  base: 300,      // 300ms - Standard
  slow: 500,      // 500ms - Deliberate
  slower: 700     // 700ms - Emphasis
};
```

### **Easing**

```typescript
const easing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out'
};
```

### **Kullanım Örnekleri**
- **Button press**: 150ms easeOut
- **Screen transition**: 300ms easeInOut
- **Loading animation**: 700ms linear (loop)
- **Modal open**: 300ms easeOut

---

## 🔘 Component Standartları

### **Button**

```typescript
// Primary Button
{
  backgroundColor: colors.accent,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
  opacity: pressed ? 0.7 : 1
}

// Secondary Button
{
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center'
}

// Text Button
{
  paddingVertical: 8,
  paddingHorizontal: 12,
  opacity: pressed ? 0.6 : 1
}
```

### **Input Field**

```typescript
{
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  color: colors.textPrimary,
  minHeight: 48,
  
  // Focus state
  focusBorderColor: colors.accent,
  focusBorderWidth: 2,
  
  // Error state
  errorBorderColor: '#ef4444',
  errorBorderWidth: 1
}
```

### **Card**

```typescript
{
  backgroundColor: colors.surface,
  borderRadius: 16,
  padding: 24,
  borderWidth: 1,
  borderColor: colors.border,
  
  // Shadow (iOS)
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  
  // Elevation (Android)
  elevation: 3
}
```

### **Badge**

```typescript
{
  backgroundColor: colors.accentSoft,
  borderRadius: 9999,
  paddingVertical: 4,
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center'
}
```

---

## 📱 Responsive Design

### **Screen Sizes**

```typescript
const breakpoints = {
  xs: 0,      // Extra small (phones)
  sm: 375,    // Small (compact phones)
  md: 414,    // Medium (standard phones)
  lg: 768,    // Large (tablets)
  xl: 1024    // Extra large (large tablets)
};
```

### **Safe Area Padding**

```typescript
const safeAreaPadding = {
  horizontal: 16,  // 16px on sides
  vertical: 12,    // 12px top/bottom
  top: 24,         // Extra top padding
  bottom: 32       // Extra bottom padding (for notch)
};
```

---

## 🌙 Dark/Light Mode Implementation

### **useTheme Hook**

```typescript
import { useTheme } from '@/theme/ThemeProvider';

export function MyComponent() {
  const { scheme, colors, accent } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>
        Adaptive text
      </Text>
    </View>
  );
}
```

### **Conditional Styling**

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 16
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16
  }
});
```

---

## ♿ Accessibility (A11y)

### **Color Contrast**

- **WCAG AA**: Minimum 4.5:1 for normal text
- **WCAG AAA**: Minimum 7:1 for enhanced contrast

### **Touch Targets**

- **Minimum**: 44x44 points (iOS), 48x48 dp (Android)
- **Recommended**: 56x56 points

### **Text Scaling**

```typescript
// Support dynamic text sizing
allowFontScaling: true,
maxFontSizeMultiplier: 1.3
```

### **Screen Reader Support**

```typescript
<Pressable
  accessible={true}
  accessibilityLabel="Giriş yap butonu"
  accessibilityHint="E-posta ve şifreyi girdikten sonra tıkla"
  accessibilityRole="button"
>
  <Text>Giriş yap</Text>
</Pressable>
```

---

## 🎨 Auth Screen Standartları

### **Layout**

```
┌─────────────────────────┐
│                         │ ← 64px top padding
│  ipelya (brand)         │
│  Tekrar hoş geldin      │ ← Title
│  Subtitle text          │ ← Subtitle
│                         │ ← 24px gap
│  ┌─────────────────────┐│
│  │ Email Input         ││ ← Card (rounded 28)
│  │ Password Input      ││
│  │ Forgot Password     ││
│  │ Error Message       ││
│  │ Login Button        ││
│  └─────────────────────┘│
│                         │ ← 24px gap
│  Don't have account?    │
│  Sign up               │
│                         │ ← 40px bottom padding
└─────────────────────────┘
```

### **Gradient Background**

```typescript
<LinearGradient
  colors={["#120817", "#1a1023", "#120817"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
/>
```

### **Card Style**

```typescript
{
  backgroundColor: "rgba(18, 8, 23, 0.85)",
  borderRadius: 28,
  padding: 24,
  gap: 18,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.05)"
}
```

---

## 📋 Component Checklist

### **Login Screen**

- [ ] Gradient background
- [ ] Brand logo (ipelya)
- [ ] Title + subtitle
- [ ] Email input with icon
- [ ] Password input with icon
- [ ] Forgot password link
- [ ] Error message display
- [ ] Login button (primary)
- [ ] Loading state
- [ ] Sign up link (footer)
- [ ] Keyboard handling
- [ ] Accessibility labels
- [ ] Dark/light mode support
- [ ] Responsive layout

---

## 🚀 Implementation Guide

### **Step 1: Import Theme**

```typescript
import { useTheme } from '@/theme/ThemeProvider';
```

### **Step 2: Use Colors**

```typescript
const { colors, scheme } = useTheme();

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 16
  }
});
```

### **Step 3: Apply Spacing**

```typescript
const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, 2xl: 32
};

<View style={{ gap: spacing.lg, padding: spacing.xl }}>
  {/* Content */}
</View>
```

### **Step 4: Add Accessibility**

```typescript
<Pressable
  accessible={true}
  accessibilityLabel="Button label"
  accessibilityRole="button"
>
  <Text>Button</Text>
</Pressable>
```

---

## 📚 Design System Files

```
src/theme/
├── ThemeProvider.tsx    ← Theme context + colors
├── colors.ts            ← Color constants
└── index.ts             ← Exports

src/components/
├── layout/
│   ├── AuthScreen.tsx   ← Auth layout
│   └── PageScreen.tsx   ← Page layout
├── forms/
│   └── AuthTextField.tsx ← Input component
└── buttons/
    └── Button.tsx       ← Button component
```

---

## ✅ Best Practices

1. **Always use theme colors** - Never hardcode colors
2. **Respect safe areas** - Use SafeAreaView
3. **Test accessibility** - Use screen reader
4. **Support both modes** - Light + dark
5. **Consistent spacing** - Use spacing system
6. **Smooth animations** - Use easing functions
7. **Touch targets** - Minimum 44x44 points
8. **Error states** - Clear feedback
9. **Loading states** - Show progress
10. **Keyboard handling** - Proper insets

---

**Tasarım sistemi hazır! 🎨**
