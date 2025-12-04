# 🤖 AI Creator Clone (Dijital İkiz)

## 1. Konsept
Creator'ların kendi kişiliklerini, konuşma tarzlarını ve (opsiyonel) seslerini kopyalayan bir AI asistanı eğitmesi. Bu AI, Creator çevrimdışıyken hayranlarla (Shadow Modda) sohbet eder, flört eder ve Coin karşılığı etkileşime girer.

**Motto:** "Sen uyurken gölgen çalışsın."

## 2. Kullanıcı Deneyimi (UX)

### Creator Tarafı (Eğitim)
1.  **Persona Ayarı:** Creator, AI'ın tonunu seçer (Utangaç, Dominant, Şakacı, Gizemli).
2.  **Veri Yükleme:** Geçmiş sohbet loglarını (anonimleştirilmiş) veya örnek cümleleri sisteme yükler.
3.  **Sınırlar (Boundaries):** AI'ın asla konuşmayacağı konuları (Hard limits) belirler.
4.  **Fiyatlandırma:** Dakika başı veya mesaj başı Coin bedeli belirler.

### Fan Tarafı (Etkileşim)
1.  **Giriş:** Fan, Creator'ın profiline girer ve "Shadow AI ile Konuş" butonuna basar.
2.  **Uyarı:** "Şu an bir AI ile konuşuyorsunuz, Creator değil" uyarısı net bir şekilde gösterilir.
3.  **Sohbet:** Fan yazar, AI anında (Creator'ın tarzında) cevap verir.
4.  **Ödeme:** Her mesajda veya dakikada bakiyeden Coin düşer.

## 3. Teknik Mimari (Supabase & LLM)

### Database
```sql
CREATE TABLE ai_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- AI Konfigürasyonu
  system_prompt TEXT NOT NULL, -- Kişilik tanımı
  base_model TEXT DEFAULT '?',
  
  -- Ekonomi
  price_per_message INTEGER DEFAULT 5,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id UUID NOT NULL REFERENCES ai_clones(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  total_messages INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Functions (LLM Entegrasyonu)
*   `chat-with-clone`:
    1.  Kullanıcının bakiyesini kontrol et.
    2.  OpenAI API (veya Anthropic) çağrısı yap.
        *   `system`: Creator'ın özel prompt'u + "Sen bir AI'sın ama X gibi davranıyorsun."
        *   `messages`: Sohbet geçmişi.
    3.  Cevabı döndür ve Coin düş.

## 4. Mobil Uygulama (Expo)
*   **Chat UI:** Standart mesajlaşma arayüzü (`react-native-gifted-chat` veya custom).
*   **Typing Indicator:** AI cevap üretirken "Yazıyor..." animasyonu (gerçekçilik için gecikmeli).

## 5. Riskler & Çözümler
*   **Halüsinasyon:** AI saçma veya tehlikeli şeyler söyleyebilir.
    *   *Çözüm:* OpenAI Moderation API ile çıktıları filtrele.
*   **Parasocial İlişki:** Fanlar AI'a aşık olabilir.
    *   *Çözüm:* Periyodik olarak "Bu bir simülasyondur" hatırlatması.
