---
title: İPELYA Mobil - Layout System
description: Sabit layout yapısı, safe area handling, padding ve spacing sistemi
---

# 📐 İPELYA Mobil - Layout System

**Versiyon**: 1.0.0  
**Durum**: 🔄 In Progress  
**Sorun**: Beyaz çerçeve, yapısal bozulmalar

---

## 🔍 Tespit Edilen Sorunlar

### **1. Beyaz Çerçeve (White Border)**
- ❌ SafeAreaView edges ayarı yanlış
- ❌ Padding hesaplaması hatalı
- ❌ Background color uyuşmazlığı

### **2. Yapısal Bozulmalar**
- ❌ AuthScreen gradient tam ekranı kaplayamıyor
- ❌ Card padding/margin tutarsız
- ❌ ScrollView inset ayarları yanlış

### **3. UI/UX Standart Sapması**
- ❌ Spacing tutarsız
- ❌ Border radius uyuşmazlığı
- ❌ Color consistency sorunları

---

## ✅ Çözüm: Sabit Layout Sistemi

### **1. SafeAreaView Düzeltme**

**Mevcut (Yanlış)**:
```typescript
<SafeAreaView 
  style={[baseStyles.safe, { backgroundColor: colors.background }]} 
  edges={["left", "right"]}  // ❌ Top/bottom yok
>
```

**Düzeltilmiş (Doğru)**:
```typescript
<SafeAreaView 
  style={[baseStyles.safe, { backgroundColor: colors.background }]} 
  edges={["top", "bottom", "left", "right"]}  // ✅ Tüm edges
>
```

---

### **2. Layout Constants**

```typescript
// src/theme/layout.ts

export const LAYOUT_CONSTANTS = {
  // Padding
  screenPaddingHorizontal: 16,    // 16px sides
  screenPaddingVertical: 12,      // 12px top/bottom
  screenPaddingTop: 24,           // Extra top
  screenPaddingBottom: 32,        // Extra bottom (notch)
  
  // Gaps
  sectionGap: 24,                 // Between sections
  componentGap: 16,               // Between components
  inputGap: 12,                   // Between inputs
  
  // Border Radius
  radiusSmall: 8,                 // 8px
  radiusMedium: 12,               // 12px
  radiusLarge: 16,                // 16px
  radiusXL: 24,                   // 24px
  radiusXXL: 28,                  // 28px (cards)
  radiusFull: 9999,               // Pill
  
  // Min Heights
  touchTargetMin: 44,             // iOS minimum
  buttonMinHeight: 48,            // Button
  inputMinHeight: 48,             // Input
  
  // Shadows
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  }
};
```

---

### **3. PageScreen Düzeltme**

```typescript
// src/components/layout/PageScreen.tsx

export function PageScreen({ 
  children, 
  contentStyle, 
  scrollViewProps, 
  showNavigation = true 
}: PageScreenProps) {
  const layout = useDeviceLayout();
  const { colors, scheme } = useTheme();
  const { tabs, activeKey, onChange } = useTabsNavigation();
  
  // ✅ Doğru padding hesaplaması
  const contentContainerStyle = [
    baseStyles.scrollContent,
    {
      paddingTop: LAYOUT_CONSTANTS.screenPaddingTop,
      paddingBottom: showNavigation 
        ? LAYOUT_CONSTANTS.screenPaddingBottom + layout.navHeight
        : LAYOUT_CONSTANTS.screenPaddingBottom,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      gap: LAYOUT_CONSTANTS.sectionGap,
      minHeight: '100%'  // ✅ Full height
    },
    resolveStyle(contentStyle, layout)
  ];

  return (
    <SafeAreaView 
      style={[baseStyles.safe, { backgroundColor: colors.background }]} 
      edges={["top", "bottom", "left", "right"]}  // ✅ Tüm edges
    >
      <View style={baseStyles.chrome}>
        <ScrollView
          style={baseStyles.scrollView}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ 
            top: 0, 
            bottom: 0,
            left: 0,
            right: 0
          }}
          contentInsetAdjustmentBehavior="never"
          {...scrollViewProps}
        >
          {resolveChildren(children, layout)}
        </ScrollView>
        {showNavigation ? <BottomNavigation /> : null}
      </View>
    </SafeAreaView>
  );
}
```

---

### **4. AuthScreen Düzeltme**

```typescript
// src/components/layout/AuthScreen.tsx

export function AuthScreen({ 
  title, 
  subtitle, 
  footer, 
  children 
}: AuthScreenProps) {
  const { colors } = useTheme();
  
  return (
    <PageScreen 
      showNavigation={false} 
      contentStyle={styles.pageContent}
    >
      {() => (
        <LinearGradient 
          colors={["#120817", "#1a1023", "#120817"]} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView 
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brand}>ipelya</Text>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {children}
            </View>

            {/* Footer */}
            {footer ? (
              <View style={styles.footer}>
                {footer}
              </View>
            ) : null}
          </ScrollView>
        </LinearGradient>
      )}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    padding: 0,  // ✅ No padding (gradient handles it)
    gap: 0
  },
  gradient: {
    flex: 1,
    paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
    paddingTop: LAYOUT_CONSTANTS.screenPaddingTop,
    paddingBottom: LAYOUT_CONSTANTS.screenPaddingBottom
  },
  content: {
    gap: LAYOUT_CONSTANTS.sectionGap,
    flexGrow: 1
  },
  header: {
    gap: 8
  },
  brand: {
    color: "#f472b6",
    fontSize: 16,
    letterSpacing: 4,
    textTransform: "uppercase",
    fontWeight: "600"
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700"
  },
  subtitle: {
    color: "#d1d5db",
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    borderRadius: LAYOUT_CONSTANTS.radiusXXL,
    padding: LAYOUT_CONSTANTS.screenPaddingHorizontal,
    gap: LAYOUT_CONSTANTS.inputGap,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  footer: {
    alignItems: "center",
    gap: 8,
    paddingTop: LAYOUT_CONSTANTS.sectionGap
  }
});
```

---

### **5. AuthTextField Düzeltme**

```typescript
// src/components/forms/AuthTextField.tsx

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(
  function AuthTextField({ label, error, icon, ...props }, ref) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputShell, error && styles.errorShell]}>
          {icon ? (
            <Ionicons 
              name={icon} 
              size={18} 
              color={colors.accentSoft} 
            />
          ) : null}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            minHeight={LAYOUT_CONSTANTS.inputMinHeight}
            {...props}
          />
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    );
  }
);

function createStyles(colors: any) {
  return StyleSheet.create({
    wrapper: {
      gap: LAYOUT_CONSTANTS.componentGap / 2  // 6px
    },
    label: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 14
    },
    inputShell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      backgroundColor: colors.surfaceAlt,
      minHeight: LAYOUT_CONSTANTS.inputMinHeight
    },
    errorShell: {
      borderColor: "#ef4444",
      borderWidth: 1.5
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "400"
    },
    errorText: {
      color: "#fca5a5",
      fontSize: 12,
      fontWeight: "500"
    }
  });
}
```

---

## 📐 Layout Hierarchy

```
SafeAreaView (edges: all)
├── View (chrome)
│   ├── ScrollView
│   │   ├── LinearGradient (auth screens)
│   │   │   ├── View (header)
│   │   │   ├── View (card)
│   │   │   └── View (footer)
│   │   └── Content
│   └── BottomNavigation
```

---

## 🎯 Spacing Guidelines

### **Screen Level**
```
Top Padding:    24px
Bottom Padding: 32px (+ nav height if present)
Horizontal:     16px
```

### **Section Level**
```
Gap between sections: 24px
```

### **Component Level**
```
Gap between inputs:   12px
Gap between elements: 16px
Gap between label/input: 6px
```

---

## 🔲 Border Radius Standards

| Element    | Radius  | Usage       |
| ---------- | ------- | ----------- |
| **Input**  | 12px    | Form fields |
| **Button** | 12px    | Buttons     |
| **Card**   | 24-28px | Containers  |
| **Badge**  | 9999px  | Pill shapes |

---

## 📱 Safe Area Handling

### **All Edges**
```typescript
edges={["top", "bottom", "left", "right"]}
```

### **Specific Edges**
```typescript
// Auth screens (no nav)
edges={["top", "bottom", "left", "right"]}

// Main screens (with nav)
edges={["top", "left", "right"]}  // Bottom handled by nav
```

---

## ✅ Checklist

### **PageScreen**
- [ ] SafeAreaView all edges
- [ ] Correct padding
- [ ] ScrollView insets
- [ ] Background color full
- [ ] No white borders

### **AuthScreen**
- [ ] Gradient full screen
- [ ] Card styling consistent
- [ ] Padding correct
- [ ] Footer spacing

### **AuthTextField**
- [ ] Theme colors used
- [ ] Min height 48px
- [ ] Border radius 12px
- [ ] Error state styled
- [ ] Icon color correct

### **Login Screen**
- [ ] No white borders
- [ ] Spacing consistent
- [ ] Colors adaptive
- [ ] Accessibility maintained

---

## 🚀 Implementation Steps

1. **Create layout.ts**
   - Define LAYOUT_CONSTANTS
   - Export to all components

2. **Update PageScreen.tsx**
   - Fix SafeAreaView edges
   - Correct padding
   - Fix ScrollView insets

3. **Update AuthScreen.tsx**
   - Use layout constants
   - Fix gradient
   - Fix card styling

4. **Update AuthTextField.tsx**
   - Use theme colors
   - Use layout constants
   - Fix styling

5. **Test**
   - No white borders
   - Consistent spacing
   - All modes (light/dark)
   - All devices

---

**Layout sistemi hazır! 🎨**
