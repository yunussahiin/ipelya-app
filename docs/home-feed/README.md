# İpelya Home Feed System - Documentation

## 📚 Genel Bakış

Bu klasör, İpelya Home Feed sisteminin tam implementasyonu için gerekli tüm dökümanları içerir. Sistem, Instagram ve X (Twitter) tarzı etkileşimli bir sosyal medya feed'i sunar.

---

## 🎯 Temel Özellikler

### Content Types
- **User Posts** - Instagram tarzı görsel + açıklama paylaşımları
- **Mini Posts** - Twitter/X tarzı kısa metin paylaşımları
- **Voice Moments** - Ses kayıtları (10-20 saniye)
- **Polls** - Anketler ve oylamalar
- **Time Capsules** - 24 saat sonra kaybolan içerikler
- **Profile Suggestions** - Algoritma tabanlı profil önerileri
- **IRL Events** - Şehir etkinlikleri entegrasyonu
- **Micro Groups** - İlgi alanı bazlı mini topluluklar

### Benzersiz Özellikler
- **Vibe Match Feed™** - Mood bazlı içerik filtreleme
- **Instant Chemistry** - Post üzerinden doğrudan chat başlatma
- **Anon Mode** - Anonim paylaşım seçeneği
- **Crystal Gifts** - Dijital hediye sistemi
- **Adaptive Feed** - Kullanıcı davranışlarına göre öğrenen algoritma
- **Social Graph Engine** - Gerçek zamanlı bağlantı haritası

---

## 📖 Döküman İndeksi

### 1. [feed-system-todo-list.md](./feed-system-todo-list.md)
**Ana todo list ve ilerleme takibi**
- 12 phase, 159 görev
- Sprint planlaması
- İlerleme metrikleri

### 2. [01-SYSTEM-ARCHITECTURE.md](./01-SYSTEM-ARCHITECTURE.md)
**Sistem mimarisi ve teknik yapı**
- Mimari katmanlar
- Data flow şemaları
- Component hiyerarşisi
- Technology stack
- Performance optimization
- Scalability stratejileri

### 3. [02-DATABASE-SCHEMA.md](./02-DATABASE-SCHEMA.md)
**Database tasarımı ve RLS policies**
- 19 ana tablo
- İlişki tabloları
- RLS policies
- Indexes & triggers
- Functions & views
- Performance optimization

### 4. [03-API-ENDPOINTS.md](./03-API-ENDPOINTS.md)
**REST API endpoints ve kullanım**
- Feed endpoints
- Post CRUD operations
- Social interactions
- Search & discovery
- User preferences
- Rate limiting

### 5. [04-UI-COMPONENTS.md](./04-UI-COMPONENTS.md)
**UI/UX component library**
- Design system
- Color palette (light/dark)
- Typography
- Core components
- Animations
- Accessibility

### 6. [05-ALGORITHM-SCORING.md](./05-ALGORITHM-SCORING.md)
**Feed algoritması ve scoring sistemi**
- Relevance scoring
- Vibe Match algorithm
- Intent Match algorithm
- Social Graph scoring
- Diversity mixing
- Adaptive learning

### 7. [06-SECURITY-MODERATION.md](./06-SECURITY-MODERATION.md)
**Güvenlik ve içerik moderasyonu**
- Authentication & RLS
- Rate limiting
- AI moderation
- User reporting
- Abuse prevention
- GDPR compliance

### 8. [07-REALTIME-NOTIFICATIONS.md](./07-REALTIME-NOTIFICATIONS.md)
**Realtime updates ve push notifications**
- Supabase Realtime
- WebSocket channels
- Push notifications (Expo)
- Notification preferences
- Analytics

---

## 🚀 Hızlı Başlangıç

### Önkoşullar
- Node.js 18+
- pnpm 8+
- Supabase account
- Expo account (EAS)
- OpenAI API key (moderation)

### Kurulum

1. **Dependencies:**
```bash
pnpm install
```

2. **Environment Variables:**
```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

3. **Database Setup:**
```bash
# Run migrations
pnpm supabase db push

# Seed data (optional)
pnpm supabase db seed
```

4. **Start Development:**
```bash
# Mobile app
cd apps/mobile
pnpm dev

# Web dashboard (ops)
cd apps/web
pnpm dev
```

---

## 📊 İlerleme Durumu

### Phase 1: Dökümentasyon ✅ (Tamamlandı)
- 8 detaylı döküman
- 159 görev planlaması
- Sistem mimarisi tasarımı

### Phase 2-12: Implementation 🚧 (Devam Ediyor)
- Database migrations
- Edge Functions
- Mobile UI components
- Algoritma implementasyonu
- Testing & deployment

**Toplam İlerleme:** %6 (9/159 görev)

---

## 🎨 Design System

### Renk Paleti

**Light Mode:**
- Primary: `#FF6B9D` (Pembe)
- Secondary: `#4ECDC4` (Turkuaz)
- Background: `#FFFFFF`
- Surface: `#F8F9FA`

**Dark Mode:**
- Primary: `#FF6B9D`
- Secondary: `#4ECDC4`
- Background: `#121212`
- Surface: `#1E1E1E`

### Typography
- Font Family: Inter (primary), Poppins (headings)
- Font Sizes: 12px - 36px
- Font Weights: 400, 500, 600, 700

---

## 🏗️ Mimari Özeti

```
Mobile App (React Native + Expo)
    ↓
Shared Packages (@types, @api, @hooks)
    ↓
Supabase Backend
    ├── Edge Functions (Deno)
    ├── PostgreSQL (Database)
    ├── Realtime (WebSocket)
    ├── Storage (Media)
    └── Auth (Authentication)
    ↓
External Services
    ├── OpenAI (Moderation)
    ├── CDN (Images)
    └── Analytics (Mixpanel)
```

---

## 🔐 Güvenlik

### Katmanlar
1. **Authentication** - Supabase Auth
2. **Authorization** - Row Level Security (RLS)
3. **Rate Limiting** - API rate limits
4. **Input Validation** - Zod schemas
5. **Content Moderation** - AI + manual review
6. **Data Privacy** - GDPR compliant

---

## 📈 Performans

### Optimizasyonlar
- Feed caching (5 min TTL)
- Image optimization (WebP)
- Lazy loading
- Cursor-based pagination
- Materialized views
- Connection pooling

### Metrikler
- Feed load time: < 1s
- API response time: < 200ms
- Image load time: < 500ms
- Realtime latency: < 50ms

---

## 🧪 Testing

### Test Türleri
- Unit tests (Jest)
- Component tests (React Native Testing Library)
- Integration tests (Detox)
- E2E tests (user flows)
- Performance tests
- Security tests

---

## 📱 Platform Desteği

### Mobile
- iOS 13+
- Android 8+
- Expo SDK 54+

### Web (Ops Dashboard)
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

---

## 🤝 Katkıda Bulunma

1. Dökümanları oku
2. Todo-list'ten görev seç
3. Branch oluştur
4. Implementasyon yap
5. Test yaz
6. Pull request aç

---

## 📞 İletişim

**Proje:** İpelya Home Feed System
**Durum:** Development
**Son Güncelleme:** 2025-11-24
**Versiyon:** 0.1.0

---

## 📝 Notlar

### Önemli Kararlar
- Supabase BaaS kullanımı
- Expo managed workflow
- Zustand state management
- React Query server state
- OpenAI moderation API

### Gelecek Planlar
- ML-based recommendation engine
- Video support
- Story feature
- Live streaming
- AR filters

---

## 🔗 Bağlantılar

- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [OpenAI API](https://platform.openai.com/docs)

---

**© 2025 İpelya - All Rights Reserved**
