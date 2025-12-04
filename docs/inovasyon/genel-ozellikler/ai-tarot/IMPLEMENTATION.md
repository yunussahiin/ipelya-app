# 🔮 AI Tarot & Horoscope (Günlük Fal)

## 1. Konsept
Kullanıcının doğum haritası (Burç) ve uygulama içi aktivitelerine (Mood, Etkileşimler) dayanarak, Yapay Zeka (LLM) tarafından üretilen kişiselleştirilmiş günlük Tarot falı veya Astroloji yorumu.

**Amaç:** Kullanıcının uygulamaya her gün girmesi (Daily Retention) için bir sebep yaratmak.

## 2. Kullanıcı Deneyimi (UX)
1.  **Sabah Bildirimi:** "Bugün yıldızlar senin için ne diyor? 🌙"
2.  **Kart Seçimi:** Ekranda ters duran 3 Tarot kartı belirir. Kullanıcı birini seçer.
3.  **Yorum:** Kart animasyonla açılır. AI, kartın anlamını kullanıcının hayatına uyarlayarak yorumlar.
    *   *Örnek:* "Kılıç Üçlüsü çıktı. Bugün eski bir arkadaşından haber alabilirsin, iletişimde sakin kal."
4.  **Paylaşım:** Şık bir görsel kart olarak Story'ye atılır.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE user_horoscopes (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  card_name TEXT, -- 'The Fool'
  interpretation TEXT, -- AI yorumu
  lucky_color TEXT,
  lucky_number INTEGER,
  
  PRIMARY KEY (user_id, date)
);
```

### Edge Functions (AI)
*   `generate-daily-reading`:
    1.  Kullanıcının burcunu ve son 24 saatteki modunu (varsa) al.
    2.  Rastgele bir Tarot kartı seç.
    3.  OpenAI API'ye prompt gönder: *"Sen mistik bir falcısın. Kullanıcı Aslan burcu ve dün çok aktifti. Ona [Kart İsmi] kartını yorumla."*
    4.  Sonucu kaydet ve döndür.

## 4. Mobil Uygulama
*   **Animasyon:** `react-native-reanimated` ile kartın dönme (Flip) efekti.
*   **Görsel:** Tarot kartlarının yüksek kaliteli illüstrasyonları (Midjourney ile üretilebilir).

## 5. Monetization
*   **Günlük 1 Fal:** Ücretsiz.
*   **Detaylı Aşk Falı:** 50 Coin.
*   **İlişki Uyumu (Synastry):** Partnerinle uyumuna bakmak 100 Coin.
