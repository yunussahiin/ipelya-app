# 🎨 Profile Skins (Profil Temaları)

## 1. Konsept
Kullanıcıların profillerini standart görünümden çıkarıp, farklı renk paletleri, arka plan desenleri, özel fontlar ve buton stilleriyle (Skin) kişiselleştirmesi.

**Amaç:** Kendini ifade etme özgürlüğü ve Coin harcamak için güçlü bir motivasyon (Monetization).

## 2. Kullanıcı Deneyimi (UX)
1.  **Mağaza:** Kullanıcı "Tema Mağazası"na girer.
    *   *Kategoriler:* Neon, Retro, Minimalist, Cyberpunk, Mevsimsel (Yılbaşı, Cadılar Bayramı).
2.  **Önizleme:** Temayı kendi profili üzerinde anlık olarak dener (Preview).
3.  **Satın Alma:** Beğendiği temayı Coin ile satın alır (Kalıcı veya Aylık).
4.  **Uygulama:** Profilini ziyaret eden **herkes** bu temayı görür.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE profile_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- 'cyberpunk-v1'
  
  -- Stil Tanımları (JSON)
  colors JSONB NOT NULL, -- { primary: '#ff00ff', background: '#000000', text: '#ffffff' }
  assets JSONB, -- { background_image: 'url', border_image: 'url' }
  font_family TEXT,
  
  price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_themes (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  theme_id UUID NOT NULL REFERENCES profile_themes(id),
  is_equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Opsiyonel (Kiralama modeli için)
  
  PRIMARY KEY (user_id, theme_id)
);
```

### Logic
*   `get_user_profile`: Kullanıcı profili çekilirken `active_theme` bilgisi de join edilerek getirilir.
*   **Caching:** Tema tanımları (renkler vs.) sık değişmediği için Client tarafında veya Redis'te cache'lenmelidir.

## 4. Mobil Uygulama (Expo & Styling)
Dinamik stil yönetimi için `Unistyles` veya `NativeWind` (Tailwind) vars'a CSS değişkenleri kullanılabilir.

*   **Context API:** `ThemeContext` içinde aktif temanın renkleri tutulur.
*   **Component:** Tüm UI bileşenleri (Button, Card, Text) bu Context'ten renkleri okur.
    ```typescript
    const { theme } = useTheme();
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.primary }}>Profil Başlığı</Text>
    </View>
    ```
*   **Assets:** Arka plan görselleri için `expo-image` (caching destekli) kullanılır.

## 5. Gelir Modeli
Skins, oyun dünyasında (Fortnite, LoL) kanıtlanmış en büyük gelir kalemidir. Sosyal medyada da "Statü" göstergesi olarak çok satar.
