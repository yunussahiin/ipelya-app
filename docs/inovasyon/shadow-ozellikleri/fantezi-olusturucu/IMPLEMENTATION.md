# 🧙‍♂️ Fantasy Generator (Kendini Baştan Yarat)

## 1. Konsept
Kullanıcıların kendi fotoğraflarını yükleyerek, Generative AI (Stable Diffusion / Midjourney) yardımıyla kendilerini farklı fantezi temalarında (Vampir, Cyberpunk, Anime, Latex, Noir) yeniden yaratması.

**Amaç:** Shadow profil için anonim ama kişisel bir avatar oluşturmak.

## 2. Kullanıcı Deneyimi (UX)
1.  **Upload:** Kullanıcı 1-3 adet net yüz fotoğrafı yükler.
2.  **Tema Seçimi:** Hazır presetlerden birini seçer (örn: "Gothic Vampire", "Space Marine", "Neon Noir").
3.  **Generate:** 50 Coin karşılığı "Oluştur" der.
4.  **Sonuç:** 4 farklı varyasyon üretilir. Beğendiğini profil fotosu yapar veya indirir.

## 3. Teknik Mimari

### Edge Functions & GPU
Bu işlem ağır olduğu için Supabase Edge Function tek başına yetmez. Replicate veya Fal.ai gibi bir GPU API kullanılmalıdır.

*   `generate-fantasy-avatar`:
    1.  Fotoğrafı al ve geçici storage'a yükle.
    2.  Replicate API'ye (örn: `fofr/face-to-many` veya LoRA eğitilmiş model) istek at.
    3.  Webhook ile sonucu bekle.
    4.  Sonucu kullanıcıya ilet.

### Database
```sql
CREATE TABLE fantasy_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  input_image_url TEXT NOT NULL,
  output_image_urls TEXT[], -- Array of URLs
  theme TEXT NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 4. Mobil Uygulama
*   **Image Picker:** `expo-image-picker` ile fotoğraf seçimi.
*   **Loading State:** İşlem 10-20 saniye sürebilir. Eğlenceli bir loading animasyonu veya "Arka planda hazırlanıyor, bitince bildirim atacağız" akışı.

## 5. Riskler
*   **Müstehcenlik (Deepfake):** Kullanıcılar başkalarının fotosunu yükleyip uygunsuz içerik üretebilir.
    *   *Çözüm:* Sadece kullanıcının kendi yüzünü (selfie check ile) doğruladığı fotoları kabul et. NSFW filtresini API seviyesinde açık tut.
