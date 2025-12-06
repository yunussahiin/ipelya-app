# İpelya Web – Clubhouse Anasayfa Esinli Landing & Animasyon Dokümanı

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion

> Amaç: Clubhouse anasayfasının hissini (minimal landing, avatar/creator odaklı görünüm, scroll ile geçiş) **İpelya web landing** sayfasına uyarlamak.
> Bu doküman, LLM’e verildiğinde Next.js tarafında component bazlı kod üretebilmesi için hazırlanmıştır.


## Brief 

Bu dosyayı LLM’e şu şekilde tanımlayabilirsin:

> “Aşağıdaki markdown, İpelya web landing sayfası için Clubhouse anasayfasından esinlenilmiş bir ürün & tasarım & animasyon spec’i.
> Next.js (App Router), TypeScript, Tailwind, shadcn/ui ve Framer Motion kullanıyorum.
> Bu dokümana göre:
>
> * `LandingPage`, `LandingHeader`, `LandingScrollLayout`, `LandingHero`, `CreatorStripSection`, `CreatorStrip`, `CreatorAvatarCard`, `ValuePropsSection`, `DownloadSection`, `LandingFooter` component’lerini oluştur.
> * Component bazlı, dosya bazlı organize et (`components/landing/...`).
> * Clubhouse hissini koru: minimal, tek CTA, scroll ile hero → avatar geçişi.
> * Kodları TypeScript + “use client” uyumlu yaz.”



---

## 1. Genel Yaklaşım

* **Referans:** clubhouse.com landing (tek CTA, ultra minimal)
* **Hedef:**

  * Web’de **tek sayfa** (single landing) deneyimi
  * Hero’da büyük tipografi + tek CTA
  * Aşağı scroll ile:

    * Header opaklaşır
    * Hero küçülür / kaybolur
    * Creator/Avatar strip’i ortaya çıkar
* **Tek aksiyon:** “İpelya’yı indir” + opsiyonel “Giriş yap” linki.

Felsefe:

> “Az içerik – güçlü his – tek aksiyon.”

---

## 2. Teknoloji & Temel Kütüphaneler

### 2.1. Next.js Yapı

* **App Router** (örn. `app/(marketing)/page.tsx`)
* TypeScript

### 2.2. UI & Stil

* **Tailwind CSS**
* **shadcn/ui** bileşenleri:

  * `Button`
  * `Avatar`, `AvatarImage`, `AvatarFallback`
  * `Card` (opsiyonel)
  * `Separator`
  * `Tooltip` (avatar üzerine isim göstermek için opsiyonel)

### 2.3. Animasyon

* **Framer Motion**:

  * `motion.div`
  * `useScroll`, `useTransform` (scroll-linked animasyonlar)
* Lightweight, SSR uyumlu (Next.js ile sık kullanılıyor)

LLM’den kod isterken:

> “Framer Motion + shadcn/ui + Tailwind kullan.” diye özellikle belirt.

---

## 3. Sayfa Hiyerarşisi (Component Tree)

Next.js tarafında ana sayfa:

```tsx
// app/(marketing)/page.tsx
export default function Page() {
  return <LandingPage />;
}
```

`LandingPage` component’i kendi içinde şu yapıya sahip olacak:

```tsx
// components/landing/landing-page.tsx
export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05040A] to-[#0B0714] text-white">
      <LandingHeader />
      <LandingScrollLayout>
        <LandingHero />
        <CreatorStripSection />
        <ValuePropsSection />
        <DownloadSection />
        <LandingFooter />
      </LandingScrollLayout>
    </div>
  );
}
```

> Not: `LandingScrollLayout` scroll + header animasyonunu yönetmek için kullanılan wrapper component olacak.

### 3.1. Component Listesi

* `LandingPage`
* `LandingHeader`
* `LandingScrollLayout` (scroll + motion context)
* `LandingHero`
* `CreatorStripSection`

  * `CreatorStrip`
  * `CreatorAvatarCard`
* `ValuePropsSection`
* `DownloadSection` (QR / Store link alanı)
* `LandingFooter`

---

## 4. Görsel & Layout Tasarım Detayları

### 4.1. Renk Paleti (İpelya Web Öneri)

Tailwind’de theme’e gömülebilir (örn. `--ipelya-*` custom CSS variables):

* **Background (body):** `#05040A`
* **Surface:** `#101018`
* **Primary Accent (love/pink):** `#FF2D92`
* **Secondary Accent (mavi):** `#5B8CFF`
* **Text primary:** `#FFFFFF`
* **Text muted:** `#B5B5C0`
* **Border muted:** `#2A2A38`
* **Glow:** `rgba(255, 45, 146, 0.5)`

### 4.2. Tipografi

* **Hero Başlık:**

  * Desktop: `text-5xl md:text-6xl`, `font-semibold`
* **Hero Alt Metin:**

  * `text-base md:text-lg`, `text-muted-foreground`
* **Section başlıkları:**

  * `text-2xl md:text-3xl`, `font-semibold`

### 4.3. Layout

* Genişlik: `max-w-6xl` / `max-w-5xl` container
* Yatay padding: `px-4 md:px-6`
* Hero yüksekliği:

  * İlk ekranı dolduracak şekilde `min-h-[80vh]`

---

## 5. Animasyon Davranışları

### 5.1. Scroll → Hero & Header Geçişi

**Davranış:**

* Sayfa açıldığında:

  * Header transparan / blur düşük
  * Hero full görünür
* Scroll aşağı:

  * Hero:

    * Scale: 1 → 0.9
    * Opacity: 1 → 0
    * TranslateY: 0 → -40px
  * Header:

    * Background: transparan → opak
    * Shadow artar
  * Creator strip:

    * Opacity: 0 → 1
    * TranslateY: 40px → 0

**Framer Motion Spec (useScroll):**

* `useScroll({ target: ref, offset: ["start start", "end start"] })`
* `const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9])`
* `const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])`
* `const headerBgOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])`

LLM’den iste:

> Hero ve header için `useScroll + useTransform` kullan, scroll’a göre stil değiştiren `motion.div` üret.

### 5.2. Avatar Strip – Auto Scroll & Hover

**Auto-scroll davranışı (Clubhouse hissi):**

* Avatar strip’i yatay bir `overflow-x-hidden` alanında duracak.
* İçerideki avatar listesi:

  * `motion.div` ile `animate={{ x: ["0%", "-50%"] }}`
    `transition={{ repeat: Infinity, duration: 40, ease: "linear" }}`
* Listeyi sonsuz göstermek için:

  * Creator listesi 2 kere ardışık renderlanabilir (`[...creators, ...creators]`).

**Hover / Focus davranışı:**

* Desktop:

  * Hover’da:

    * Scale: 1 → 1.08
    * Shadow: `shadow-lg`
    * Border rengi: `border-fuchsia-400`
* Mobile:

  * Tap’te scale animasyonu, alt tooltip veya mini card açılması.

---

## 6. Component Bazlı Spec

Bu bölüm LLM’in doğrudan component oluşturmaya başlayacağı API tanımlarıdır.

### 6.1. `LandingHeader`

**Görev:**

* Sol: İpelya logo / yazı
* Sağ:

  * “Giriş yap” link
  * “İpelya’yı indir” buton
* Scroll’a göre arka plan ve border değişir.

**Props:**

```ts
type LandingHeaderProps = {
  scrollProgress?: MotionValue<number>; // useScroll'dan gelebilir
};
```

**Davranış:**

* `scrollProgress` yoksa default statik bir header.
* Varsa:

  * `bg-opacity` ve `backdrop-blur` scroll’a göre artar.

### 6.2. `LandingHero`

**İçerik:**

* Küçük emoji / icon (örn. el sallama 👋)
* Büyük başlık:

  * Örn: “Creator’ların en gerçek hâli”
* Alt satır:

  * “Gerçek içerikler, gerçek kazançlar, tek yerde: İpelya.”
* CTA:

  * `Button variant="default"` (shadcn)
* Secondary:

  * Daha küçük text: “Sadece mobilde. iOS ve Android’de ücretsiz.”

**Props:**

```ts
type LandingHeroProps = {
  scrollProgress?: MotionValue<number>;
};
```

**Animasyon:**

* `motion.div` + `style={{ scale: heroScale, opacity: heroOpacity, y: heroTranslateY }}`
  `heroScale`, `heroOpacity`, `heroTranslateY` → `useTransform(scrollProgress, ...)` ile.

### 6.3. `CreatorStripSection`

**Bileşenler:**

* `CreatorStripSection`

  * başlık + açıklama + strip
* `CreatorStrip`

  * auto-scroll yapan container
* `CreatorAvatarCard`

  * tek avatar kartı

**Creator tipi:**

```ts
export type LandingCreator = {
  id: string;
  name: string;
  handle?: string;
  avatarUrl: string;
  isLive?: boolean;
  isPremium?: boolean;
  tag?: string; // "Foto hikayeler", "Sohbet", vb.
};
```

**CreatorAvatarCard stil:**

* `Avatar` (shadcn)
* Dış çerçeve:

  * `rounded-full border border-fuchsia-400/60 shadow-[0_0_25px_rgba(255,45,146,0.4)]`
* Altında:

  * `name`
  * `tag` / `handle`

**Animasyon:**

* Hover: `whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(255,45,146,0.5)" }}`

### 6.4. `ValuePropsSection`

3 kutuluk grid:

* Örnek maddeler:

  1. “Gerçek içerikler”
     `Creator’ların sansürsüz içeriklerini tek yerde keşfet.`
  2. “Güvenli ödeme”
     `Ödemelerin ve aboneliklerin güvenli şekilde yönetildiği sistem.`
  3. “Creator gelir modeli”
     `Creator’ların abonelik ve özel paketlerle gelir kazanabildiği yapı.`

**Layout:**

* Mobile: `grid-cols-1`
* Desktop: `grid-cols-3`

shadcn `Card` veya custom div.

### 6.5. `DownloadSection`

Clubhouse’taki QR hissi:

* Sol:

  * “İpelya’yı hemen indir” başlık
  * Altına iOS / Android store butonları (şimdilik placeholder)
* Sağ:

  * QR code (şimdilik image placeholder yolu)

**Behaviors:**

* Hover’da çok hafif scale & glow.

---

## 7. Animasyon Implementation Sketch (Framer Motion)

LLM’in referans alacağı temel iskelet:

```tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function LandingScrollLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  return (
    <div ref={ref} className="relative">
      {/* Header scrollYProgress ile besleniyor */}
      <LandingHeader scrollProgress={scrollYProgress} />

      {/* Ana içerik */}
      <main className="pt-20">
        {/* LandingHero scrollYProgress'i alarak scale/opacity ayarlayacak */}
        {/* Diğer section'lar basit fade/slide animasyonları kullanabilir */}
        {children}
      </main>
    </div>
  );
}
```

```tsx
// Örnek Hero iç animasyon
export function LandingHero({ scrollProgress }: LandingHeroProps) {
  const scale = useTransform(scrollProgress ?? { get: () => 0 } as any, [0, 0.3], [1, 0.9]);
  const opacity = useTransform(scrollProgress ?? { get: () => 0 } as any, [0, 0.3], [1, 0]);
  const y = useTransform(scrollProgress ?? { get: () => 0 } as any, [0, 0.3], [0, -40]);

  return (
    <motion.section
      style={{ scale, opacity, y }}
      className="flex min-h-[80vh] items-center justify-center px-4"
    >
      {/* içerik */}
    </motion.section>
  );
}
```

> Not: LLM’den gerçek implementasyon isterken `scrollProgress` undefined ise fallback kullanmasını, SSR uyumunu düşünmesini söyleyebilirsin.

---


