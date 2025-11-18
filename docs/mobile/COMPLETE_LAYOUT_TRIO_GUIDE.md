---
title: İPELYA Mobil - SafeArea & Layout Trio Rehberi
description: SafeAreaView, flex, ScrollView ile tüm cihazlara oturan login ekranı
---

# 📐 React Native – Ekranı Cihaza Göre Uyumlu Yapma Rehberi

Bu rehber, login ekranında yaşanan beyaz çerçeve + fullscreen boşluk sorunlarını çözen **SafeAreaView + flex + ScrollView** üçlüsünü, iOS ve Android’de toplam ekran ömrünü sağlayacak şekilde anlatır.

---

## ✅ 1. SafeAreaView + Flex: Dış Kaplama

**Sorun:** SafeAreaView’e `flex:1` verilmezse (özellikle çentikli iPhone'larda) içerik ekranın ortasında toplanır ve beyaz kenar kalır.

**Çözüm:** En dış bileşene (PageScreen) mutlaka `flex:1` ver:

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
  <View style={{ flex: 1, backgroundColor: colors.background }}>...</View>
</SafeAreaView>
```

- SafeAreaView içinde `edges={["top","bottom","left","right"]}` tüm insetleri uygular.
- İçerideki `<View>` (chrome) de `flex:1` olmalı ki gradient/arka plan tam ekranı kaplasın.
- Biz `PageScreen` içinde SafeAreaView + `chrome` wrapper’ı hem flex:1 hem backgroundColor ile uyguladık.

---

## ✅ 2. ScrollView + flexGrow:1 + child genişliği

**Sorun:** ScrollView ters şekilde content’i ortalıyor, height:600 gibi sabit değerlerden dolayı ekran tam dolmuyor.

**Çözüm:**
```tsx
<ScrollView
  style={{ flex: 1, backgroundColor: colors.background }}
  contentContainerStyle={{ flexGrow: 1, minHeight: '100%' }}
>
  {/* içerik */}
</ScrollView>
```

- `flexGrow:1` sayesinde içeriğin container’ı full boy oluyor.
- `minHeight: '100%'` ile iOS’te beyaz çerçeve önlenir.
- Biz `contentContainerStyle` içinde `gap`, `minHeight: '100%'`, `padding` tanımladık.
- `scrollEventThrottle={16}` ve `showsVerticalScrollIndicator={false}` ile UX iyileşti.

---

## ✅ 3. Sabit height olmadan responsive padding & gap

**Sorun:** `height: 600` gibi sabit değerler (genelde kart, button, gradient) farklı cihazlarda dar kalır.

**Çözüm:**
- `flex` bazlı layout (`flex:1`, `padding` vs `height`) kullan.
- `LAYOUT_CONSTANTS` + `useResponsive` ile padding/top/bottom adaptif.
- Login kart ve button’larda `minHeight`, `padding` ve `borderRadius` responsive.

```tsx
<View style={{ flex: 1, paddingHorizontal: width < 768 ? 16 : 32 }}>
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <Text style={{ fontSize: width < 375 ? 24 : 32 }}>Title</Text>
  </View>
</View>
```

---

## ✅ 4. Ekstra önlemler (iOS & Android)

| Problem                 | Çözüm                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **iOS çentik/pill**     | SafeAreaView edges + `useSafeAreaInsets().top/bottom` ekle.                                              |
| **Android beyaz input** | `AuthTextField` içinde `backgroundColor: colors.surfaceAlt`, `minHeight: 48`, platform-specific padding. |
| **Yüksek DPI**          | `useWindowDimensions().fontScale` ile tipoyu uyumlu hale getir.                                          |
| **Shadow/Glows**        | `PageScreen` içinde edge glow backgroundColor ile bezel gizlenir.                                        |

---

## 📚 Mevcut Kod Açıklaması
- `PageScreen.tsx`: SafeAreaView, flex, scrollView, background fix.
- `AuthScreen.tsx`: Gradient+ScrollView, responsive padding, card stilleri.
- `AuthTextField.tsx`: Theme ile renk, platform spesifik padding/minHeight.
- `login.tsx`: Buttonları responsive, disabled state, android elevation.
- `layout.ts`/`responsive.ts`/`useResponsive.ts`: Sabitler + cihaz listesi.

---

## ✅ Kontrol Listesi
- [x] SafeAreaView edges tüm kenarlarda (PageScreen)
- [x] ScrollView flexGrow + minHeight + background
- [x] chrome wrapper + gradient (full ekran) background-fixed
- [x] Responsive padding/top/bottom (AuthScreen + layout constants)
- [x] AuthCard + TextField minHeight, Android padding
- [x] Button minHeight, elevation (Android), lineHeight
- [x] Theme colors kullanımı, accent/custom

---

## 🛠️ React Native/Expo Kitaplık Önerileri (Openshift değil, destek amaçlı)
- `react-native-safe-area-context`: Safe area insets, zaten Expo’da var.
- `react-native-responsive-screen`: `wp`, `hp` yüzdelik ölçüler için.
- `react-native-size-matters`: Ölçeklenmiş ölçüler (scale, verticalScale).
- `react-native-responsive-fontsize`: `RFPercentage()` ile font.

Bu kütüphaneler olmadan da **flex + SafeAreaView + ScrollView** yeterli; yukarıdakiler sadece ek kolaylık.

---

İstediğin zaman bu yapıyı register/onboarding için de uygulayayım; ayrıca senin belirttiğin cihaz listesi (iPhone 15-17, Galaxy S24 vs.) için test senaryosu yazıp dokümante edebilirim.
