# Supabase Database Linter - Güvenlik ve Performans Raporu

> **Son Güncelleme:** 3 Aralık 2025  
> **Kaynak:** Supabase Dashboard → Database → Linter  
> **Durum:** 📋 Migration'lar hazır, uygulama bekliyor

---

## 📁 Dosya Yapısı

```
docs/supabase/
├── README.md                    # Bu dosya - Genel özet
├── SECURITY-FIXES.md            # Güvenlik düzeltme script'leri
├── PERFORMANCE-ADVISORS.md      # Performans analizi detayları
├── PERFORMANCE-FIXES.md         # Performans düzeltme script'leri
├── MIGRATION-PLAN.md            # Migration stratejisi ve adımları
├── security-advisors.md         # Ham security JSON (kaynak veri)
└── performance/
    ├── Warnings.json            # Ham performance WARN JSON
    └── info.json                # Ham performance INFO JSON

supabase/migrations/
├── 20241203_001_enable_rls_admin_tables.sql   # Admin tabloları RLS
├── 20241203_002_enable_rls_user_tables.sql    # User tabloları RLS
├── 20241203_003_fix_rls_initplan.sql          # auth.uid() optimizasyonu
├── 20241203_004_remove_duplicate_policies.sql # Duplicate policy temizliği
├── 20241203_005_remove_duplicate_indexes.sql  # Duplicate index temizliği
└── 20241203_006_add_missing_indexes.sql       # Eksik index'ler
```

---

## 📊 Özet Dashboard

### Güvenlik Uyarıları (Security)

| Seviye      | Sayı | Açıklama                      |
| ----------- | ---- | ----------------------------- |
| 🔴 **ERROR** | 19   | Kritik - Hemen düzeltilmeli   |
| 🟡 **WARN**  | 30+  | Uyarı - Düzeltilmesi önerilir |
| 🔵 **INFO**  | 2    | Bilgi - Kontrol edilmeli      |

### Performans Uyarıları (Performance)

| Seviye     | Sayı | Açıklama                                         |
| ---------- | ---- | ------------------------------------------------ |
| 🟡 **WARN** | 100+ | RLS initplan, duplicate index, multiple policies |
| 🔵 **INFO** | 80+  | Unindexed FK, unused index                       |

---

## 🔴 Kritik Güvenlik Sorunları (ERROR)

### 1. RLS Disabled in Public (17 tablo)

**Risk Seviyesi:** 🔴 KRİTİK  
**Tehlike:** Bu tablolara **herkes erişebilir** (anon key ile bile)

**Etkilenen Tablolar:**

| Tablo                           | Açıklama                   | Hassasiyet |
| ------------------------------- | -------------------------- | ---------- |
| `ops_conversations`             | Admin sohbetleri           | Yüksek     |
| `ops_conversation_participants` | Admin sohbet katılımcıları | Yüksek     |
| `user_intents`                  | Kullanıcı niyetleri        | Orta       |
| `post_shares`                   | Post paylaşımları          | Orta       |
| `post_mentions`                 | Mention'lar                | Orta       |
| `poll_options`                  | Anket seçenekleri          | Düşük      |
| `poll_votes`                    | Anket oyları               | Orta       |
| `user_vibes`                    | Kullanıcı vibes            | Düşük      |
| `user_interests`                | Kullanıcı ilgi alanları    | Düşük      |
| `user_connections`              | Kullanıcı bağlantıları     | Orta       |
| `crystal_gifts`                 | Hediye kristalleri         | Yüksek     |
| `micro_groups`                  | Mikro gruplar              | Orta       |
| `group_members`                 | Grup üyeleri               | Orta       |
| `feed_items`                    | Feed öğeleri               | Orta       |
| `algorithm_configs`             | Algoritma ayarları         | Yüksek     |
| `moderation_queue`              | Moderasyon kuyruğu         | Yüksek     |
| `feed_analytics`                | Feed analitiği             | Orta       |

**Çözüm:**
```sql
-- Her tablo için RLS aktif et
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Uygun policy'ler ekle
CREATE POLICY "policy_name" ON public.table_name
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 2. Policy Exists RLS Disabled (1 tablo)

**Risk Seviyesi:** 🔴 KRİTİK  
**Tablo:** `ops_conversation_participants`

**Durum:** RLS policy'leri oluşturulmuş ama RLS aktif edilmemiş. Policy'ler çalışmıyor!

**Mevcut Policy'ler (çalışmıyor):**
- `ops_conversation_participants_update_own`
- `ops_participants_select_own`
- `ops_participants_select_same_conv`

**Çözüm:**
```sql
ALTER TABLE public.ops_conversation_participants ENABLE ROW LEVEL SECURITY;
```

---

### 3. Security Definer View (1 view)

**Risk Seviyesi:** 🔴 KRİTİK  
**View:** `current_coin_rate`

**Tehlike:** Bu view `SECURITY DEFINER` olarak tanımlı. View'ı çağıran kullanıcının değil, view'ı **oluşturan kullanıcının** yetkileriyle çalışıyor.

**Çözüm:**
```sql
-- View'ı SECURITY INVOKER olarak yeniden oluştur
CREATE OR REPLACE VIEW public.current_coin_rate
WITH (security_invoker = true)
AS
  -- view query
;
```

---

## 🟡 Güvenlik Uyarıları (WARN)

### 4. Function Search Path Mutable (30+ fonksiyon)

**Risk Seviyesi:** 🟡 ORTA  
**Tehlike:** SQL injection'a açık olabilir

**Etkilenen Fonksiyonlar (örnekler):**
- `handle_new_follower_notification`
- `handle_follow_back_notification`
- `get_active_profile_type`
- `increment_post_likes` / `decrement_post_likes`
- `increment_post_comments` / `decrement_post_comments`
- `increment_comment_likes` / `decrement_comment_likes`
- `handle_updated_at`
- `handle_new_message_notification`

**Çözüm:**
```sql
-- Fonksiyonu search_path ile yeniden oluştur
CREATE OR REPLACE FUNCTION public.function_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- function body
END;
$$;
```

---

### 5. Leaked Password Protection Disabled

**Risk Seviyesi:** 🟡 ORTA  
**Durum:** Supabase Auth'da sızdırılmış şifre koruması kapalı.

**Çözüm:** Supabase Dashboard → Authentication → Settings → Enable "Leaked Password Protection"

---

## 🔵 Bilgi (INFO)

### 6. RLS Enabled No Policy (2 tablo)

**Tablolar:**
- `polls`
- `voice_moments`

**Durum:** RLS aktif ama hiç policy yok. Kimse bu tablolara erişemiyor (service role hariç).

---

## 📁 Dosya Yapısı

```
docs/supabase/
├── README.md                    # Bu dosya - Genel özet
├── security-advisors.md         # Ham security JSON verisi
└── performance/
    ├── Warnings.md              # Ham performance WARN JSON
    └── info.md                  # Ham performance INFO JSON
```

---

## 🔗 Referanslar

- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Security Best Practices](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

---

## 📋 Öncelik Sıralaması

| Öncelik | Uyarı                      | Neden                          | Aksiyon                    |
| ------- | -------------------------- | ------------------------------ | -------------------------- |
| 1️⃣       | RLS Disabled tablolar      | Herkes tüm verilere erişebilir | RLS aktif et + policy ekle |
| 2️⃣       | Policy Exists RLS Disabled | Policy'ler çalışmıyor          | RLS aktif et               |
| 3️⃣       | Security Definer View      | Yetki yükseltme riski          | SECURITY INVOKER yap       |
| 4️⃣       | Function Search Path       | SQL injection riski            | search_path ekle           |
| 5️⃣       | RLS Enabled No Policy      | Erişim engeli (bug olabilir)   | Policy ekle veya RLS kapat |
| 6️⃣       | Leaked Password            | Zayıf şifre riski              | Dashboard'dan aktif et     |
