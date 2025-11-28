# Moderasyon Sistemi

İçerik moderasyonu için kapsamlı bir sistem. Admin panelinden içerikleri gizleme, silme, uyarma ve geri yükleme işlemleri yapılabilir.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Veritabanı Şeması](#veritabanı-şeması)
3. [Edge Functions](#edge-functions)
4. [API Routes](#api-routes)
5. [UI Bileşenleri](#ui-bileşenleri)
6. [İşlem Türleri](#işlem-türleri)
7. [Bildirim Sistemi](#bildirim-sistemi)

---

## Genel Bakış

Moderasyon sistemi şu içerik türlerini destekler:
- **Post** - Standart gönderiler (medyalı/medyasız)
- **Mini Post (Vibe)** - Kısa metin paylaşımları
- **Poll** - Anketler
- **Voice Moment** - Ses kayıtları
- **Comment** - Yorumlar ve yanıtlar

### Temel Özellikler
- ✅ İçerik gizleme/gösterme
- ✅ Kalıcı silme (soft delete)
- ✅ Uyarı gönderme
- ✅ Kullanıcıya bildirim
- ✅ İşlem geçmişi kaydı
- ✅ Neden şablonları
- ✅ Özel neden yazma

---

## Veritabanı Şeması

### `moderation_actions` Tablosu
Tüm moderasyon işlemlerinin kaydı.

```sql
CREATE TABLE moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  target_type text NOT NULL, -- 'post', 'mini_post', 'poll', 'voice_moment', 'comment'
  target_id uuid NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL, -- 'hide', 'unhide', 'delete', 'restore', 'warn'
  reason_code text, -- Şablon kodu
  reason_custom text, -- Özel açıklama
  previous_state jsonb, -- Önceki durum
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### `moderation_reason_templates` Tablosu
Önceden tanımlı moderasyon nedenleri.

```sql
CREATE TABLE moderation_reason_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text, -- 'content', 'behavior', 'spam', 'legal'
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### Varsayılan Neden Şablonları
| Kod                     | Başlık                   | Kategori |
| ----------------------- | ------------------------ | -------- |
| `inappropriate_content` | Uygunsuz İçerik          | content  |
| `spam`                  | Spam / İstenmeyen İçerik | spam     |
| `harassment`            | Taciz / Zorbalık         | behavior |
| `hate_speech`           | Nefret Söylemi           | behavior |
| `violence`              | Şiddet İçerikli          | content  |
| `copyright`             | Telif Hakkı İhlali       | legal    |
| `misinformation`        | Yanlış Bilgi             | content  |
| `other`                 | Diğer                    | other    |

### İçerik Tablolarındaki Moderasyon Sütunları

Her içerik tablosunda (`posts`, `polls`, `voice_moments`, `post_comments`) şu sütunlar bulunur:

| Sütun               | Tip         | Açıklama                       |
| ------------------- | ----------- | ------------------------------ |
| `is_hidden`         | boolean     | Kullanıcıdan gizli mi?         |
| `moderation_status` | text        | 'visible', 'hidden', 'deleted' |
| `moderated_at`      | timestamptz | Son moderasyon zamanı          |
| `moderated_by`      | uuid        | Moderasyonu yapan admin        |

---

## Edge Functions

### `moderate-content`
İçerik moderasyonu ana fonksiyonu.

**Endpoint:** `POST /functions/v1/moderate-content`

**Request Body:**
```json
{
  "target_type": "post",
  "target_id": "uuid",
  "action_type": "hide",
  "reason_code": "inappropriate_content",
  "reason_custom": "Ek açıklama (opsiyonel)",
  "send_notification": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action_id": "uuid",
    "target_type": "post",
    "target_id": "uuid",
    "action_type": "hide",
    "new_status": "hidden",
    "notification_sent": true
  }
}
```

### `get-moderation-logs`
Moderasyon geçmişini getirir.

**Endpoint:** `GET /functions/v1/get-moderation-logs`

**Query Parameters:**
| Parametre        | Tip    | Açıklama                         |
| ---------------- | ------ | -------------------------------- |
| `page`           | int    | Sayfa numarası (default: 1)      |
| `limit`          | int    | Sayfa başına kayıt (default: 20) |
| `admin_id`       | uuid   | Admin filtresi                   |
| `target_type`    | string | İçerik türü filtresi             |
| `action_type`    | string | İşlem türü filtresi              |
| `target_user_id` | uuid   | Hedef kullanıcı filtresi         |
| `start_date`     | date   | Başlangıç tarihi                 |
| `end_date`       | date   | Bitiş tarihi                     |

---

## API Routes

### Web Ops API

| Route                         | Method | Açıklama                   |
| ----------------------------- | ------ | -------------------------- |
| `/api/ops/moderation/action`  | POST   | Moderasyon işlemi yap      |
| `/api/ops/moderation/logs`    | GET    | Moderasyon loglarını getir |
| `/api/ops/moderation/reasons` | GET    | Neden şablonlarını getir   |

---

## UI Bileşenleri

### ModerationDialog
`/apps/web/app/ops/(private)/feed/viewer/components/moderation-dialog.tsx`

Moderasyon işlemi için modal dialog.

**Props:**
```typescript
interface ModerationDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: "post" | "mini_post" | "poll" | "voice_moment" | "comment";
  targetId: string;
  currentStatus?: "visible" | "hidden" | "deleted";
  onSuccess?: () => void;
}
```

**Özellikler:**
- İşlem türü seçimi (Gizle/Göster/Sil/Uyar)
- Neden şablonu seçimi
- Özel neden yazma
- Bildirim gönderme seçeneği
- İşlem açıklamaları

### Moderasyon Logları Sayfası
`/apps/web/app/ops/(private)/feed/moderation/logs/page.tsx`

Tüm moderasyon işlemlerinin listesi.

**Özellikler:**
- İçerik türü filtresi
- İşlem türü filtresi
- Pagination
- Admin ve hedef kullanıcı bilgileri
- Neden ve açıklama görüntüleme

---

## İşlem Türleri

### 1. Gizle (hide)
- İçerik kullanıcıdan gizlenir
- Admin panelinde görünür kalır
- `is_hidden: true`, `moderation_status: 'hidden'`
- Geri alınabilir

### 2. Göster (unhide)
- Gizlenen içerik tekrar görünür yapılır
- `is_hidden: false`, `moderation_status: 'visible'`

### 3. Kalıcı Sil (delete)
- Soft delete - veritabanından silinmez
- `is_hidden: true`, `moderation_status: 'deleted'`
- Geri alınabilir (restore)

### 4. Geri Yükle (restore)
- Silinen içerik geri yüklenir
- `is_hidden: false`, `moderation_status: 'visible'`

### 5. Uyar (warn)
- İçerik durumu değişmez
- Kullanıcıya uyarı bildirimi gönderilir
- Sadece kayıt tutulur

---

## Bildirim Sistemi

Moderasyon işlemlerinde kullanıcıya otomatik bildirim gönderilir.

### Bildirim Mesajları

| İşlem          | Başlık                   | Mesaj                                                                                |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| hide           | "{İçerik} gizlendi"      | "{İçerik} topluluk kurallarına aykırı bulunduğu için gizlendi. Neden: {Neden}"       |
| delete         | "{İçerik} kaldırıldı"    | "{İçerik} topluluk kurallarına aykırı bulunduğu için kaldırıldı. Neden: {Neden}"     |
| warn           | "Uyarı aldınız"          | "{İçerik} hakkında uyarı aldınız. Neden: {Neden}. Lütfen topluluk kurallarına uyun." |
| unhide/restore | "{İçerik} geri yüklendi" | "{İçerik} inceleme sonucunda geri yüklendi."                                         |

### İçerik Türü İsimleri
- post → "Gönderiniz"
- mini_post → "Vibeniz"
- poll → "Anketiniz"
- voice_moment → "Ses kaydınız"
- comment → "Yorumunuz"

---

## Kullanım Örnekleri

### Feed Viewer'da Moderasyon
```tsx
// PostCard'da moderasyon butonu
<Button onClick={() => setModerationItem(item)}>
  <IconEyeOff />
</Button>

// ModerationDialog
<ModerationDialog
  open={!!moderationItem}
  onClose={() => setModerationItem(null)}
  targetType={moderationItem.content_type}
  targetId={moderationItem.content.id}
  currentStatus={moderationItem.is_hidden ? "hidden" : "visible"}
  onSuccess={() => fetchFeed(true)}
/>
```

### Yorum Moderasyonu
```tsx
// CommentItem'da hover'da görünen buton
<Button
  className="opacity-0 group-hover:opacity-100"
  onClick={() => onModerate(comment.id)}
>
  <IconEyeOff />
</Button>
```

---

## Güvenlik

### Yetkilendirme
- Tüm moderasyon işlemleri admin yetkisi gerektirir
- `admin_profiles` tablosunda `is_active: true` kontrolü
- JWT token doğrulaması

### Audit Trail
- Her işlem `moderation_actions` tablosuna kaydedilir
- Önceki durum (`previous_state`) JSON olarak saklanır
- Admin ID, tarih, neden kaydedilir

---

## ModerationBadge Bileşeni

Feed kartlarında moderasyon durumunu gösteren interaktif badge.

**Dosya:** `/apps/web/app/ops/(private)/feed/viewer/components/moderation-badge.tsx`

### Özellikler
- **Durum Gösterimi**: Gizli (turuncu), Silindi (kırmızı), Uyarıldı (sarı)
- **Detay Popover**: Tıklayınca neden, admin, tarih bilgileri
- **Hızlı Aksiyonlar**: Göster, Geri Yükle, İşlemi Değiştir butonları

### Kullanım
```tsx
<ModerationBadge 
  item={feedItem} 
  onChangeAction={() => setModerationItem(feedItem)} 
/>
```

### Görünüm
| Durum    | Renk    | İkon              |
| -------- | ------- | ----------------- |
| Gizli    | Turuncu | IconEyeOff        |
| Silindi  | Kırmızı | IconTrash         |
| Uyarıldı | Sarı    | IconAlertTriangle |

---

## ModerationDialog Bileşeni

İçerik moderasyonu için detaylı dialog.

**Dosya:** `/apps/web/app/ops/(private)/feed/viewer/components/moderation-dialog.tsx`

### Özellikler
- **Aktif Moderasyon Gösterimi**: Mevcut moderasyon varsa detaylarını gösterir
  - İşlem türü, neden, açıklama
  - Hangi admin, ne zaman yaptı
  - Yönetim notu (sadece adminler görür)
- **Moderasyonu Kaldırma**: Gizli içeriği gösterme, silinen içeriği geri yükleme
- **Yönetim Notu**: Admin'in iç kullanım için yazdığı not (user görmez, bildirime dahil edilmez)
- **Moderasyon Geçmişi**: Bu içerik üzerinde yapılan tüm işlemler

### İki Tür Açıklama
1. **Ek Açıklama (reason_custom)**: Kullanıcıya gösterilir, bildirime dahil edilir
2. **Yönetim Notu (admin_note)**: Sadece admin panelinde görünür, kullanıcıya gösterilmez

### Kullanım
```tsx
<ModerationDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  targetType="post"
  targetId="uuid-here"
  currentStatus="visible" // veya "hidden" veya "deleted"
  onSuccess={() => refetchData()}
/>
```

---

## TODO / Gelecek Geliştirmeler

- [x] Feed kartlarında detaylı moderasyon badge'i
- [x] İşlemi değiştirme/kaldırma butonu
- [x] Moderasyonu kaldırma (unhide/restore)
- [x] Yönetim notu (admin_note) - sadece adminler görür
- [x] Moderasyon geçmişi modalda gösterimi
- [x] İşlem geçmişinde detay modalı
- [ ] Toplu moderasyon (birden fazla içerik seçimi)
- [ ] Moderasyon kuyruğu (flagged içerikler)
- [ ] Otomatik moderasyon (AI destekli)
- [ ] Moderasyon istatistikleri dashboard
- [ ] Kullanıcı itiraz sistemi
- [ ] Moderasyon rolleri (junior/senior moderator)
