# 🏷️ Kink/Fetish Tags (Gizli Etiketler)

## 1. Konsept
Kullanıcıların cinsel tercihlerini, fetişlerini veya ilgi alanlarını (Kink) profilinde belirtmesi. Ancak bu etiketler **sadece** aynı etikete sahip diğer kullanıcılar veya Creatorlar tarafından görülebilir.

**Amaç:** "Benim gibi düşünenleri bul" (Matching) ama ifşa olma (Privacy).

## 2. Kullanıcı Deneyimi (UX)
1.  **Seçim:** Kullanıcı Shadow profil ayarlarında geniş bir listeden (Dominant, Submissive, Feet, Latex, Roleplay vb.) seçim yapar.
2.  **Görünürlük:**
    *   Normal kullanıcılar bu etiketleri görmez.
    *   Aynı etiketi seçmiş bir kullanıcı profile girdiğinde, o etiket "Parlayarak" görünür (Match!).
3.  **Arama:** Creatorlar "Sadece 'Roleplay' seven fanlarımı listele" diyebilir.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE kink_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'dominant', 'submissive' etc.
  category TEXT, -- 'role', 'object', 'action'
  icon_url TEXT
);

CREATE TABLE user_kinks (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tag_id UUID NOT NULL REFERENCES kink_tags(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);
```

### Logic (Görünürlük)
Client tarafında tüm etiketleri çekip filtrelemek güvenlik açığıdır.
*   **RPC Function:** `get_matching_kinks(target_user_id)`
    *   Sadece `auth.uid()` ile `target_user_id` arasındaki **ortak** etiketleri döndürür. Diğerlerini asla döndürmez.

## 4. Mobil Uygulama
*   **UI:** Etiketler "Blurlu" durur, ortak olanlar net ve renkli görünür.
*   **Onboarding:** Shadow moda ilk girişte zevkli bir seçim ekranı.

## 5. Hassasiyet
Bu veriler çok hassastır (GDPR/KVKK). Veritabanında şifreli tutulması veya kullanıcı sildiğinde tamamen (hard delete) silinmesi önerilir.
