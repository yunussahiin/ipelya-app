# 🎭 Roleplay Scenarios (Senaryo Modu)

## 1. Konsept
Kullanıcıların sohbet başlatırken standart "Selam" yerine, önceden tanımlanmış bir "Senaryo Kartı" seçerek oyuna başlaması.

**Amaç:** Sohbetin en zor kısmı olan "Giriş" (Ice-breaking) aşamasını atlamak ve direkt eğlenceye/fanteziye dalmak.

## 2. Kullanıcı Deneyimi (UX)
1.  **Seçim:** Sohbet ekranında "Senaryo Başlat" butonu.
2.  **Kütüphane:** Kategorize edilmiş senaryolar:
    *   *Romantik:* "İlk Buluşma", "Tesadüf"
    *   *Gerilim:* "Sorgu Odası", "Casusluk"
    *   *Fantastik:* "Vampir & Kurban", "Zaman Yolcusu"
3.  **Başlangıç:** Seçilen senaryo sohbete bir "Sistem Mesajı" olarak düşer:
    *   *"Oyun Başladı: Sen barmensin, o da dertli bir müşteri. Ona ne ikram edeceksin?"*
4.  **Özel Komutlar:** Sohbet içinde `/action` (örn: `/me kapıyı çarparak çıkar`) gibi RPG komutları aktif olur.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE roleplay_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starter_prompt_sender TEXT NOT NULL, -- Gönderene ipucu
  starter_prompt_receiver TEXT NOT NULL, -- Alıcıya ipucu
  category TEXT,
  icon_url TEXT
);

CREATE TABLE active_roleplays (
  conversation_id UUID PRIMARY KEY REFERENCES conversations(id),
  scenario_id UUID REFERENCES roleplay_scenarios(id),
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now()
);
```

### AI Desteği (Opsiyonel)
Sohbet tıkandığında bir "Dungeon Master" (AI) araya girip olayı kızıştırabilir.
*   *"Aniden elektrikler kesildi! Ne yapacaksınız?"*

## 4. Mobil Uygulama
*   **UI:** Sohbet baloncukları standarttan farklı (örn: parşömen kağıdı veya neon çerçeve) görünür.
*   **Commands:** Slash komutları (`/`) için autocomplete menüsü.

## 5. Etkileşim
Bu özellik, kullanıcıların uygulamada geçirdiği süreyi (Retention) ve mesajlaşma sıklığını ciddi oranda artırır.
