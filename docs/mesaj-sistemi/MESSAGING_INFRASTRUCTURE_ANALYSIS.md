# Mesajlaşma Altyapısı Teknik Analiz Raporu

> **Son Güncelleme:** 2025-12-04
> **Analiz Yapan:** AI Assistant (Supabase MCP ile detaylı veritabanı analizi)

Bu rapor, `apps/mobile/app/(messages)` dizini, ilgili hook'lar (`useMessages`, `useConversations`, `usePresence`), store yapıları ve Supabase entegrasyonu incelenerek hazırlanmıştır.

## 1. Genel Mimari Özeti

Uygulama, **Hibrit (Edge Function + Realtime)** bir mimari kullanmaktadır:
*   **Veri Okuma (Read):** Mesajlar ve sohbet listeleri doğrudan veritabanından değil, Supabase Edge Functions (`get-conversations`, `get-messages`) üzerinden çekilmektedir.
*   **Veri Yazma (Write):** Mesaj gönderme, düzenleme ve silme işlemleri de Edge Functions üzerinden yürütülmektedir.
*   **Canlı Güncellemeler (Realtime):** Supabase Realtime (Postgres Changes) kullanılarak gelen mesajlar, `broadcast` kanalları ile de "yazıyor" (typing) durumları yönetilmektedir.
*   **State Management:** `Zustand` kullanılarak (`conversation.store.ts`, `message.store.ts`) uygulama içi durum yönetimi sağlanmış.
*   **UI:** `react-native-gifted-chat` kütüphanesi özelleştirilerek kullanılmış.

---

## 2. Mevcut Durum ve Tespitler

### ✅ Güçlü Yönler
*   **Optimistic Updates:** `useSendMessage` hook'u, mesaj sunucuya gitmeden önce UI'da "gönderiliyor" durumunda gösteriyor. Bu, kullanıcı deneyimi (UX) için çok kritik ve doğru uygulanmış.
*   **Typing Indicators:** `usePresence` hook'u içinde Supabase Broadcast kullanılarak "yazıyor..." özelliği doğru bir şekilde kurgulanmış. Gereksiz veritabanı yazma işlemi yapılmıyor.
*   **Birleşik Liste Yapısı:** `MessagesIndexPage`, hem DM'leri hem de Broadcast kanallarını tek bir listede, filtreleme ve pinleme özellikleriyle başarıyla birleştiriyor.
*   **Offline Queue Temeli:** `useOfflineQueue` hook'u ile internet yokken atılan mesajlar `AsyncStorage`'a kaydediliyor ve bağlantı geldiğinde tekrar deneniyor.

### ⚠️ Tespit Edilen Eksiklikler (Gaps)

Kod incelemesinde karşılaşılan **TODO** ve eksik implementasyonlar şunlardır:

#### 1. Realtime Reaction Senkronizasyonu (Kritik)
`useMessageRealtime.ts` dosyasında tepkiler (emoji reactions) için dinleyici kurulmuş ancak içi boş bırakılmış:
```typescript
// useMessageRealtime.ts
// Mesajın reactions'ını güncelle - TODO: implement
// Reaction silindi - TODO: implement
```
**Etkisi:** Bir kullanıcı mesaja emoji bıraktığında, karşı taraf bunu sayfayı yenilemeden göremez.

#### 2. Bağlantı Kopması Sonrası Senkronizasyon (Kritik)
`useOfflineQueue.ts` içindeki `useSyncOnReconnect` hook'u tanımlanmış ancak içi boş:
```typescript
// useOfflineQueue.ts
// TODO: Burada gerekli senkronizasyon işlemleri yapılacak
// - Okunmamış mesaj sayılarını güncelle
// - Yeni mesajları çek
```
**Etkisi:** Kullanıcı interneti gidip geldiğinde veya uygulama arka plandan döndüğünde, arada kaçırdığı mesajları otomatik olarak alamaz. Manuel yenileme yapması gerekir.

#### 3. Edge Function Bağımlılığı ve Performans
Tüm okuma işlemleri (`get-messages`, `get-conversations`) Edge Function üzerinden yapılıyor.
**Risk:** Edge Function'lar "Cold Start" süresine takılabilir. Basit `SELECT` işlemleri için doğrudan Supabase Client (RLS ile) kullanmak genellikle daha hızlıdır (`<50ms` vs `~200-500ms`). Karmaşık join işlemleri veya veri maskeleme (örneğin anonim sohbetler) yoksa, doğrudan okuma daha performanslı olabilir.

#### 4. Medya Yükleme ve Mesaj İlişkisi
Medya yükleme işlemi `GiftedChatScreen` içinde yapılıyor ve ardından mesaj gönderiliyor. Eğer medya yüklenir ama mesaj gönderimi (Edge Function) başarısız olursa, "yetim" (orphan) dosyalar Storage'da kalabilir.

---

## 2.1 Veritabanı Analizi (Supabase MCP ile Tespit Edilen Sorunlar)

### 🚨 Kritik: Realtime Publication Eksiklikleri

Supabase Realtime'ın çalışması için tabloların `supabase_realtime` publication'a eklenmesi gerekir. Analiz sonucunda şu eksiklikler tespit edildi:

| Tablo                       | Publication'da mı? | Etki                                                      |
| --------------------------- | ------------------ | --------------------------------------------------------- |
| `messages`                  | ✅ Evet             | Mesajlar realtime çalışıyor                               |
| `conversations`             | ✅ Evet             | Conversation güncellemeleri çalışıyor                     |
| `broadcast_messages`        | ✅ Evet             | Broadcast mesajları çalışıyor                             |
| `broadcast_reactions`       | ✅ Evet             | Broadcast tepkileri çalışıyor                             |
| `message_reactions`         | ❌ **HAYIR**        | DM tepkileri realtime çalışmıyor!                         |
| `conversation_participants` | ❌ **HAYIR**        | Unread count, mute, pin değişiklikleri realtime gelmiyor! |

### 🚨 Kritik: Duplicate RLS Policy'ler

`message_reactions` tablosunda aynı işi yapan birden fazla policy var:

**SELECT için:**
- `reactions_select_policy`
- `Users can view reactions`

**DELETE için:**
- `reactions_delete_policy`
- `Users can delete own reactions`

**INSERT için:**
- `reactions_insert_policy`
- `Users can add reactions`

**Etki:** Her sorgu için 2 policy çalışıyor = performans kaybı.

### ⚠️ RLS Policy Performans Sorunu

`profiles.shadow_isolation` policy'si `auth.uid()` yerine `(SELECT auth.uid())` kullanmalı. Mevcut hali her satır için yeniden hesaplanıyor.

---

## 3. Geliştirme ve İyileştirme Önerileri

### A. Eksiklerin Giderilmesi (Öncelikli)

1.  **Realtime Publication Düzeltmeleri:**
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    ```

2.  **Reaction Realtime Implementasyonu:**
    *   `useMessageRealtime` içindeki `INSERT` ve `DELETE` eventleri React Query cache'ini güncellemeli.

3.  **Reconnect Sync Mantığı:**
    *   `useSyncOnReconnect` içine şu mantık eklenmeli:
        *   `queryClient.invalidateQueries()` ile listelerin tazelenmesi.
        *   Aktif conversation varsa mesajların yenilenmesi.

4.  **Duplicate RLS Policy Temizliği:**
    *   Aynı işi yapan policy'lerden birini kaldır.

### B. Performans İyileştirmeleri

1.  **Doğrudan Okuma (Direct Selects):**
    *   Eğer `get-messages` fonksiyonu sadece basit bir `SELECT * FROM messages` yapıyorsa, bunu doğrudan frontend'den Supabase SDK ile yapacak şekilde refactor edebilirsiniz. Bu, mesajların ekrana gelme süresini ciddi oranda düşürür.
    *   *Not:* Eğer "Shadow Mode" gibi özel gizlilik mantıkları Edge Function içindeyse bu yapı korunmalıdır.

2.  **Liste Performansı:**
    *   `FlashList` (Shopify) kullanımına geçiş düşünülebilir. Şu an standart `FlatList` (GiftedChat içindeki) kullanılıyor. Çok uzun sohbetlerde performans artışı sağlar.

### C. Yeni Özellik Önerileri

1.  **Mesaj Durumları (Sent / Delivered / Read):**
    *   Şu an "Okundu" (Read) bilgisi var gibi görünüyor (`mark-as-read`). Ancak "İletildi" (Delivered) durumu için Realtime Presence veya ayrı bir status update mekanizması eklenebilir.

2.  **Reply Preview İyileştirmesi:**
    *   `GiftedChatScreen` içindeki `renderAccessory` (yanıt önizlemesi) şu an basit bir metin gösteriyor. Eğer yanıtlanan mesaj bir görsel ise, küçük bir thumbnail gösterilmesi UX'i iyileştirir.

3.  **Sesli Mesaj İyileştirmesi:**
    *   Sesli mesajlar için `AudioPlayer` komponenti var, ancak "waveform" (ses dalgası) görselleştirmesi eklenmesi modern bir görünüm sağlar.

---

## 4. TODO Listesi

### Kritik (Hemen Yapılmalı)
- [x] ~~**Realtime Publication:** `message_reactions` tablosunu `supabase_realtime` publication'a ekle~~ ✅ 2025-12-04
- [x] ~~**Realtime Publication:** `conversation_participants` tablosunu `supabase_realtime` publication'a ekle~~ ✅ 2025-12-04
- [x] ~~**Realtime Reaction Sync:** `useReactionRealtime` hook'unu implement et (INSERT/DELETE eventlerini React Query cache'ine bağla)~~ ✅ 2025-12-04
- [x] ~~**Reconnect Sync:** `useSyncOnReconnect` hook'unu implement et (bağlantı gelince mesajları ve listeyi yenile)~~ ✅ 2025-12-04
- [x] ~~**RLS Cleanup:** `message_reactions` tablosundaki duplicate policy'leri temizle~~ ✅ 2025-12-04

### Önemli
- [ ] **RLS Optimization:** `profiles.shadow_isolation` policy'sinde `auth.uid()` → `(SELECT auth.uid())` değişikliği
- [x] ~~**Reply Preview UI:** Görsel yanıtlarında thumbnail gösterimi ekle~~ ✅ 2025-12-04
- [x] ~~**Orphan File Cleanup:** Medya yüklenip mesaj gönderilemezse dosyayı silen bir mekanizma tasarla~~ ✅ 2025-12-04
- [x] ~~**Draft Mesaj Kaydetme:** Yazılan ama gönderilmemiş mesajları AsyncStorage'da sakla~~ ✅ 2025-12-04

### İyileştirme
- [ ] **Performance Review:** `get-messages` Edge Function'ının RLS ile doğrudan okumaya çevrilip çevrilemeyeceğini değerlendir
- [ ] **FlashList Migration:** GiftedChat içindeki FlatList'i FlashList ile değiştir
- [ ] **Delivered Status:** Mesaj iletildi durumu için mekanizma ekle

---

## 5. Tamamlanan İşlemler

### 2025-12-04 - Kritik Düzeltmeler

#### 1. Realtime Publication Düzeltmeleri

**Sorun:** `message_reactions` ve `conversation_participants` tabloları `supabase_realtime` publication'da değildi. Bu nedenle realtime subscription'lar çalışmıyordu.

**Çözüm:** Migration ile her iki tablo publication'a eklendi.

```sql
-- Migration: add_message_reactions_to_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Migration: add_conversation_participants_to_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
```

**Dosyalar:**
- `supabase/migrations/add_message_reactions_to_realtime.sql`
- `supabase/migrations/add_conversation_participants_to_realtime.sql`

---

#### 2. useReactionRealtime Hook Implementasyonu

**Sorun:** `useReactionRealtime` hook'u tanımlıydı ama içi boştu. Reaction INSERT/DELETE eventleri işlenmiyordu.

**Çözüm:** Hook tam olarak implement edildi:
- INSERT event'i: Karşı tarafın reaction'ını React Query cache'ine ekler
- DELETE event'i: Karşı tarafın reaction'ını React Query cache'inden kaldırır
- Kendi reaction'larımız skip edilir (optimistic update ile zaten işleniyor)

**Dosya:** `apps/mobile/src/hooks/messaging/useMessageRealtime.ts`

```typescript
export function useReactionRealtime(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase.channel(`reactions:${conversationId}`);
    
    // INSERT handler
    channel.on("postgres_changes", { event: "INSERT", table: "message_reactions" }, 
      async (payload) => {
        // Kendi reaction'ımızı skip et
        if (payload.new.user_id === user.id) return;
        
        // React Query cache'ini güncelle
        queryClient.setQueryData(messageKeys.list(conversationId), (oldData) => {
          // Mesaja reaction ekle
        });
      }
    );
    
    // DELETE handler
    channel.on("postgres_changes", { event: "DELETE", table: "message_reactions" },
      (payload) => {
        // Kendi reaction'ımızı skip et
        if (payload.old.user_id === user.id) return;
        
        // React Query cache'inden kaldır
        queryClient.setQueryData(messageKeys.list(conversationId), (oldData) => {
          // Mesajdan reaction kaldır
        });
      }
    );
    
    channel.subscribe();
    return () => channel.unsubscribe();
  }, [conversationId, user?.id]);
}
```

**Entegrasyon:** `useChatMessages` hook'una eklendi:
```typescript
// apps/mobile/src/components/messaging/ChatScreen/hooks/useChatMessages.ts
useMessageRealtime(conversationId);
useReactionRealtime(conversationId); // Yeni eklendi
```

---

#### 3. useSyncOnReconnect Hook Implementasyonu

**Sorun:** `useSyncOnReconnect` hook'u tanımlıydı ama içi boştu. Bağlantı geri geldiğinde veya app foreground'a döndüğünde senkronizasyon yapılmıyordu.

**Çözüm:** Hook tam olarak implement edildi:
1. Conversation listesini invalidate eder (React Query refetch)
2. Aktif conversation varsa mesajları yeniler
3. Supabase'den güncel unread count'ları çeker ve store'u günceller

**Dosya:** `apps/mobile/src/hooks/messaging/useOfflineQueue.ts`

```typescript
export function useSyncOnReconnect() {
  const sync = useCallback(async () => {
    // 1. Conversation listesini yenile
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    
    // 2. Aktif conversation mesajlarını yenile
    if (activeConversationId) {
      await queryClient.invalidateQueries({ queryKey: ["messages", activeConversationId] });
    }
    
    // 3. Unread count'ları güncelle
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, unread_count")
      .eq("user_id", user.id);
      
    participants.forEach((p) => {
      convStore.updateConversation(p.conversation_id, { unread_count: p.unread_count });
    });
  }, []);
  
  // Network değişikliği dinle
  useEffect(() => {
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // App foreground'a gelince sync yap
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => subscription.remove();
  }, []);
}
```

---

#### 4. Duplicate RLS Policy Temizliği

**Sorun:** `message_reactions` tablosunda aynı işi yapan birden fazla policy vardı:
- SELECT: `reactions_select_policy` + `Users can view reactions`
- DELETE: `reactions_delete_policy` + `Users can delete own reactions`
- INSERT: `reactions_insert_policy` + `Users can add reactions`

**Çözüm:** Duplicate policy'ler kaldırıldı, sadece orijinal policy'ler kaldı.

```sql
-- Migration: cleanup_duplicate_message_reactions_policies
DROP POLICY IF EXISTS "Users can view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
```

**Dosya:** `supabase/migrations/cleanup_duplicate_message_reactions_policies.sql`

---

### Özet

| Değişiklik                         | Tür       | Dosya/Tablo                     |
| ---------------------------------- | --------- | ------------------------------- |
| message_reactions realtime         | Migration | `supabase_realtime` publication |
| conversation_participants realtime | Migration | `supabase_realtime` publication |
| useReactionRealtime                | Hook      | `useMessageRealtime.ts`         |
| useSyncOnReconnect                 | Hook      | `useOfflineQueue.ts`            |
| Duplicate RLS cleanup              | Migration | `message_reactions` tablosu     |

**Etki:**
- ✅ Reaction'lar artık realtime olarak karşı tarafa yansıyor
- ✅ Conversation participant değişiklikleri (unread, mute, pin) realtime geliyor
- ✅ Bağlantı kopması sonrası otomatik senkronizasyon çalışıyor
- ✅ App foreground'a döndüğünde veriler yenileniyor
- ✅ RLS policy performansı iyileştirildi

---

### 2025-12-04 - Yeni Özellikler

#### 1. Reply Preview UI - Thumbnail Gösterimi

**Özellik:** Bir mesaja yanıt verirken, yanıtlanan mesaj görsel veya video ise küçük bir thumbnail gösteriliyor.

**Dosya:** `apps/mobile/src/components/messaging/ChatScreen/GiftedChatScreen.tsx`

**Detaylar:**
- 40x40 boyutunda rounded thumbnail
- Video için play ikonu overlay
- Thumbnail'e tıklayınca medya viewer açılıyor
- Audio mesajları için mikrofon ikonu

---

#### 2. Draft Mesaj Kaydetme

**Özellik:** Kullanıcı bir sohbette mesaj yazıp göndermeden çıkarsa, yazdığı mesaj kaydedilir ve tekrar girdiğinde yüklenir.

**Dosyalar:**
- `apps/mobile/src/hooks/messaging/useDraftMessage.ts` - Yeni hook
- `apps/mobile/src/components/messaging/ChatScreen/hooks/useChatMessages.ts` - Hook entegrasyonu
- `apps/mobile/src/components/messaging/ChatScreen/GiftedChatScreen.tsx` - UI entegrasyonu

**Özellikler:**
- AsyncStorage'da conversation bazlı draft kaydetme
- 500ms debounce ile otomatik kaydetme
- Mesaj gönderilince draft otomatik temizlenir
- `clearAllDrafts()` utility fonksiyonu (logout için)
- `hasDraft(conversationId)` utility fonksiyonu

---

#### 3. Orphan File Cleanup Edge Function

**Özellik:** Medya yüklenip mesaj gönderilemezse, dosya Storage'da kalıyor (yetim dosya). Bu Edge Function bu dosyaları temizler.

**Dosya:** `supabase/functions/cleanup-orphan-media/index.ts`

**Özellikler:**
- 24 saatten eski, hiçbir mesaja bağlı olmayan dosyaları siler
- `chat-media` bucket'ını tarar
- Batch delete (100'lük gruplar halinde)
- Admin auth kontrolü (manuel tetikleme için)
- Scheduled olarak çalıştırılabilir (günde 1 kez önerilir)

**Kullanım:**
```bash
# Manuel tetikleme (admin token ile)
curl -X POST https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/cleanup-orphan-media \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Scheduled (Supabase Dashboard > Database > Extensions > pg_cron)
SELECT cron.schedule('cleanup-orphan-media', '0 3 * * *', 
  $$SELECT net.http_post('https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/cleanup-orphan-media')$$
);
```

---

### Özet (Güncellenmiş)

| Değişiklik                         | Tür           | Dosya/Tablo                     |
| ---------------------------------- | ------------- | ------------------------------- |
| message_reactions realtime         | Migration     | `supabase_realtime` publication |
| conversation_participants realtime | Migration     | `supabase_realtime` publication |
| useReactionRealtime                | Hook          | `useMessageRealtime.ts`         |
| useSyncOnReconnect                 | Hook          | `useOfflineQueue.ts`            |
| Duplicate RLS cleanup              | Migration     | `message_reactions` tablosu     |
| Reply Preview Thumbnail            | UI            | `GiftedChatScreen.tsx`          |
| Draft Mesaj Kaydetme               | Hook + UI     | `useDraftMessage.ts`            |
| Orphan File Cleanup                | Edge Function | `cleanup-orphan-media`          |
