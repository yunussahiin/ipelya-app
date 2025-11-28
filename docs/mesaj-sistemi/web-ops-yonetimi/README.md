# Web Ops - Mesajlaşma Sistemi Yönetimi

**Oluşturulma Tarihi:** 2025-11-28
**Referans:** `/docs/mesaj-sistemi/01-MESSAGING-SYSTEM-ARCHITECTURE.md`

---

## 📋 Genel Bakış

Bu modül, İpelya Ops Panel üzerinden mesajlaşma sisteminin yönetimini sağlar. İki ana bölümden oluşur:

### 1. Kullanıcı Mesajlaşma Yönetimi
- DM (Direct Messages) görüntüleme ve moderasyon
- Creator Broadcast kanalları yönetimi
- Mesaj içerik moderasyonu
- Shadow mesaj yönetimi

### 2. Admin Realtime Chat
- Admin kullanıcılar arası mesajlaşma
- Admin grupları oluşturma ve yönetme
- Ops panel içi iletişim

---

## 📁 Döküman Yapısı

```
web-ops-yonetimi/
├── README.md                    # Bu dosya
├── 01-ARCHITECTURE.md           # Mimari ve tasarım
├── 02-DATABASE-SCHEMA.md        # Database tabloları
├── 03-API-ENDPOINTS.md          # API route handlers
├── 04-UI-COMPONENTS.md          # UI component'leri
├── 05-ADMIN-CHAT.md             # Admin chat sistemi
└── TODO.md                      # Detaylı todo-list
```

---

## 🎯 Kapsam

### Kullanıcı Mesajlaşma Yönetimi

| Özellik                 | Açıklama                               |
| ----------------------- | -------------------------------------- |
| **DM Listesi**          | Tüm kullanıcı sohbetlerini görüntüleme |
| **Mesaj Detayları**     | Sohbet içeriğini okuma (read-only)     |
| **Broadcast Kanalları** | Creator kanallarını listeleme          |
| **Kanal Detayları**     | Kanal mesajlarını görüntüleme          |
| **Moderasyon**          | Uygunsuz mesajları gizleme/silme       |
| **Shadow Mesajlar**     | Shadow mode mesajlarını yönetme        |
| **Arama**               | Kullanıcı/mesaj arama                  |
| **Filtreleme**          | Tarih, tür, durum filtreleri           |

### Admin Realtime Chat

| Özellik              | Açıklama                    |
| -------------------- | --------------------------- |
| **1:1 Mesajlaşma**   | Admin'ler arası özel sohbet |
| **Grup Sohbetleri**  | Admin grupları oluşturma    |
| **Realtime**         | Anlık mesaj iletimi         |
| **Typing Indicator** | "Yazıyor..." göstergesi     |
| **Online Status**    | Admin online durumu         |
| **Dosya Paylaşımı**  | Dosya/resim gönderme        |
| **Mention**          | @mention desteği            |

---

## 🛠️ Teknoloji Stack

- **Frontend:** Next.js 15 + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Realtime)
- **State:** React Query + Zustand
- **Styling:** Tailwind CSS (CSS variables)
- **Icons:** Lucide React

---

## 📊 Mevcut Edge Functions

### DM İşlemleri
- `get-conversations` - Sohbet listesi
- `get-messages` - Mesaj listesi
- `send-message` - Mesaj gönderme
- `create-conversation` - Sohbet oluşturma
- `mark-as-read` - Okundu işaretleme
- `delete-message` - Mesaj silme
- `edit-message` - Mesaj düzenleme

### Broadcast İşlemleri
- `get-broadcast-channels` - Kanal listesi
- `create-broadcast-channel` - Kanal oluşturma
- `send-broadcast-message` - Yayın mesajı
- `join-broadcast-channel` - Kanala katılma
- `leave-broadcast-channel` - Kanaldan ayrılma
- `react-to-broadcast` - Tepki verme
- `vote-broadcast-poll` - Anket oylama

### Shadow İşlemleri
- `cleanup-shadow-messages` - Shadow mesaj temizleme

---

## 🔗 İlgili Dökümanlar

- [Mesaj Sistemi Mimarisi](/docs/mesaj-sistemi/01-MESSAGING-SYSTEM-ARCHITECTURE.md)
- [Mesaj Sistemi TODO](/docs/mesaj-sistemi/mesaj-sistemi-todo.md)
- [Web Ops Styling](/docs/web-ops-styling.md)

---

**Son Güncelleme:** 2025-11-28
