# AI Ops V2 - Deneyim İyileştirme Planı

## 📋 Özet

Bu döküman, AI Ops sisteminin deneyimini artırmak için yapılacak iyileştirmeleri detaylandırır.

---

## 🎯 Hedefler

1. **Post Yönetimi** - Daha zengin post işlemleri
2. **Moderasyon** - Hızlı aksiyon ve onay/red
3. **Finans** - Coin ekleme/çıkarma
4. **Analitik** - Dashboard özeti, trend analizi
5. **Görsel** - Avatar, medya önizleme, grafikler
6. **UX** - Tıklanabilir butonlar, inline aksiyonlar

---

## ✅ TODO List

### 1. İlgili İşlemler Buton Sistemi (UX)
- [x] Mevcut: Backtick ile tıklanabilir komutlar
- [x] **Yeni: Gerçek butonlar ile aksiyon** ✅
- [x] Tool UI'larda "İlgili İşlemler" bölümü ✅
- [x] Her işlem için tıklanabilir `<Button>` component ✅
- [x] Buton tıklanınca chat'e komut gönder ✅

### 2. Post Yönetimi Tool'ları
- [x] `getRecentPosts` - Post listesi
- [x] `getPostDetails` - Post detayları
- [x] `hidePost` - Post gizle
- [x] `deletePost` - Post sil
- [x] **`approvePost`** - Post onayla (moderasyon) ✅
- [x] **`rejectPost`** - Post reddet (moderasyon) ✅
- [ ] **`flagPost`** - Post işaretle
- [ ] **`bulkHidePosts`** - Toplu gizleme

### 3. Moderasyon Tool'ları
- [x] `getModerationQueue` - Moderasyon kuyruğu
- [x] `getContentReports` - Raporlar
- [ ] **`resolveReport`** - Raporu çöz
- [ ] **`dismissReport`** - Raporu reddet
- [ ] **`getSpamReport`** - Spam analizi

### 4. Finans Tool'ları
- [x] `getUserBalance` - Bakiye görüntüle
- [x] `getUserTransactions` - İşlem geçmişi
- [x] **`adjustCoinBalance`** - Coin ekle/çıkar ✅
- [ ] **`refundTransaction`** - İade işlemi
- [ ] **`getRevenueStats`** - Gelir istatistikleri

### 5. Analitik Tool'ları
- [x] `getSystemStats` - Platform istatistikleri
- [x] `getCreatorStats` - Creator istatistikleri
- [x] **`getDashboardSummary`** - Günlük özet ✅
- [ ] **`getTrendingContent`** - Trend içerikler
- [ ] **`getGrowthReport`** - Büyüme raporu
- [ ] **`compareStats`** - Karşılaştırma

### 6. Görsel İyileştirmeler
- [x] Post medya galerisi (thumbnail grid) ✅
- [ ] **Kullanıcı avatar gösterimi**
- [ ] **Post detaylarında büyük medya**
- [ ] **Mini sparkline grafikler**
- [ ] **Video player embed**

### 7. UI/UX İyileştirmeleri
- [x] DataTable ile liste görünümü
- [x] Badge'ler ile durum gösterimi
- [x] **ActionButtons component** - Tıklanabilir butonlar ✅
- [ ] **Inline aksiyonlar** - Tabloda butonlar
- [ ] **Confirmation dialog** - Tehlikeli işlemler için

### 8. Kullanıcı Yönetimi
- [x] `lookupUser` - Kullanıcı bilgisi
- [x] `banUser` / `unbanUser` - Ban işlemleri
- [x] **`verifyUser`** - Kullanıcı doğrula (mavi tik) ✅

### 9. ToolsSection.tsx Güncelleme
- [x] Yeni tool'lar eklendi ✅
- [x] Icon'lar güncellendi ✅
- [x] Açıklamalar ve örnekler eklendi ✅

### 10. Tool UI Bileşenleri
- [x] `ApprovePostUI` - Post onaylama UI ✅
- [x] `RejectPostUI` - Post reddetme UI ✅
- [x] `AdjustCoinBalanceUI` - Coin ayarlama UI (detaylı kart) ✅
- [x] `GetDashboardSummaryUI` - Dashboard özet UI (grid kartlar + alerts) ✅
- [x] `VerifyUserUI` - Kullanıcı doğrulama UI ✅

---

## 🆕 Harici Tool Önerileri (Gelecek Fazlar)

### Yüksek Öncelik
- [ ] **`getTrendingContent`** - En popüler postlar (son 24 saat, beğeni/yorum sıralı)
- [ ] **`getTopCreators`** - En başarılı creator'lar (abone, kazanç, engagement)
- [ ] **`resolveReport`** - Raporu çöz (aksiyon al + kapat)
- [ ] **`dismissReport`** - Raporu reddet (geçersiz bildir)

### Orta Öncelik
- [ ] **`bulkHidePosts`** - Toplu post gizleme (spam temizliği)
- [ ] **`getSpamReport`** - Spam analizi (şüpheli hesaplar, bot tespiti)
- [ ] **`refundTransaction`** - Coin iadesi (hatalı işlem düzeltme)
- [ ] **`getRevenueStats`** - Gelir istatistikleri (günlük/haftalık/aylık)

### Düşük Öncelik
- [ ] **`compareStats`** - Dönem karşılaştırma (bu hafta vs geçen hafta)
- [ ] **`getGrowthReport`** - Büyüme raporu (kullanıcı/post/gelir trendi)
- [ ] **`flagPost`** - Post işaretle (manuel moderasyon için)
- [ ] **`bulkSendNotification`** - Toplu bildirim (tüm kullanıcılara/creator'lara)

### UI İyileştirmeleri (Gelecek)
- [ ] **Inline tablo aksiyonları** - Tabloda direkt butonlar
- [ ] **Confirmation dialog** - Tehlikeli işlemler için onay
- [ ] **Kullanıcı avatar gösterimi** - lookupUser'da avatar
- [ ] **Mini sparkline grafikler** - Dashboard'da trend gösterimi

### 11. ToolMentionPopup.tsx Güncelleme
- [x] `verifyUser` eklendi ✅
- [x] `approvePost` eklendi ✅
- [x] `rejectPost` eklendi ✅
- [x] `getDashboardSummary` eklendi ✅
- [x] `adjustCoinBalance` eklendi ✅
- [x] Tüm V2 tool'ları @ popup'ta mevcut ✅

### 12. DatabaseSection.tsx Güncelleme
- [x] Gerçek veritabanı tabloları eklendi ✅
- [x] Kategorize edilmiş görünüm ✅
- [x] Read/Write erişim seviyeleri ✅
- [x] İstatistik kartları (toplam, read, write, kategori) ✅
- [x] 18 tablo, 6 kategori tanımlı ✅ 

---

## 🔧 Teknik Detaylar

### ActionButtons Component

```tsx
// İlgili işlemler için buton grubu
interface ActionButton {
  label: string;
  command: string;
  variant?: 'default' | 'destructive' | 'outline';
  icon?: React.ReactNode;
}

function ActionButtons({ actions }: { actions: ActionButton[] }) {
  const { append } = useChat();
  
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.command}
          variant={action.variant || 'outline'}
          size="sm"
          onClick={() => append({ role: 'user', content: action.command })}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
```

### Yeni Tool Schema'ları

```typescript
// approvePost
export const approvePostSchema = z.object({
  postId: z.string().describe('Onaylanacak post ID'),
});

// adjustCoinBalance
export const adjustCoinBalanceSchema = z.object({
  userId: z.string().describe('Kullanıcı ID veya username'),
  amount: z.number().describe('Eklenecek/çıkarılacak miktar (negatif = çıkar)'),
  reason: z.string().describe('İşlem sebebi'),
});

// getDashboardSummary
export const getDashboardSummarySchema = z.object({
  period: z.enum(['today', 'yesterday', 'week']).default('today'),
});
```

---

## 📅 Uygulama Sırası

### Faz 1 - Bugün
1. ✅ ActionButtons component oluştur
2. ✅ Tool UI'lara butonlar ekle
3. ✅ `approvePost` / `rejectPost` tool'ları
4. ✅ `adjustCoinBalance` tool'u

### Faz 2 - Bu Hafta
5. `getDashboardSummary` tool'u
6. Avatar gösterimi
7. Inline tablo aksiyonları

### Faz 3 - Gelecek Hafta
8. Trend analizi
9. Grafikler
10. Toplu işlemler

---

## 📝 Notlar

- Tool UI'lar `makeAssistantToolUI` ile oluşturuluyor
- Butonlar `useChat` hook'u ile mesaj gönderiyor
- Tüm tool'lar `tools.ts` dosyasında tanımlı
- Schema sırası önemli (assistant-ui streaming için)
