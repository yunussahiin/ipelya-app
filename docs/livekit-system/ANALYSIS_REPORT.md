# LiveKit Sistem Dokümantasyon Analizi ve Geliştirme Önerileri

**Tarih:** 5 Aralık 2024
**Durum:** Analiz Tamamlandı

## 1. Genel Değerlendirme

`docs/livekit-system` altındaki dokümantasyon oldukça kapsamlı ve iyi yapılandırılmış.
- **Mimari:** LiveKit Cloud + Supabase + Edge Functions yapısı modern ve ölçeklenebilir.
- **Veritabanı:** Şema tasarımı (`live_sessions`, `live_participants`, vb.) ihtiyaçları büyük ölçüde karşılıyor.
- **Güvenlik:** RLS politikaları ve token tabanlı erişim doğru kurgulanmış.
- **Mobil Entegrasyon:** Temel hook ve component yapısı React Native standartlarına uygun.

Ancak, prodüksiyon seviyesinde bir uygulama için bazı kritik eksiklikler ve geliştirilmesi gereken noktalar tespit edilmiştir.

## 2. Tespit Edilen Eksiklikler ve Riskler

### 2.1. VoIP Push Bildirimleri (Kritik)
- **Durum:** `TODO.md` dosyasında risk olarak belirtilmiş ancak implementasyon detayı yok.
- **Sorun:** Standart push bildirimleri, arama (calling) senaryoları için yeterli değildir. Kullanıcı uygulamayı kapattığında veya telefon kilitliyken aramanın "telefon çalar gibi" görünmesi için iOS'te **PushKit** ve **CallKeep**, Android'de ise **ConnectionService** entegrasyonu gerekir.
- **Mevcut Yapı:** `usePushNotifications.ts` sadece chat mesajları için standart bildirimleri yönetiyor.

### 2.2. Bağlantı Yönetimi ve Reconnection
- **Durum:** `MOBILE-INTEGRATION.md` basit bağlantı durumlarını ele alıyor.
- **Sorun:** Mobil cihazlarda ağ değişimi (Wi-Fi <-> 4G) veya uygulamanın arka plana atılması durumunda bağlantı kopabilir.
- **Eksik:** Otomatik yeniden bağlanma (reconnect) stratejisi ve arka planda sesin devam etmesi (background audio) için gerekli configler detaylandırılmamış.

### 2.3. Kayıt ve VOD (Video on Demand)
- **Durum:** "Faz 4" olarak işaretlenmiş, detay yok.
- **Sorun:** Canlı yayın bittikten sonra tekrar izlenebilmesi (replay) için LiveKit Egress servisi kullanılmalı ve kayıtlar bir depolama alanına (Supabase Storage veya AWS S3/R2) aktarılmalıdır.

### 2.4. Moderasyon Detayları
- **Durum:** `live_session_bans` tablosu var.
- **Eksik:** Bir kullanıcı banlandığında, o an canlı yayındaysa socket bağlantısının nasıl kesileceği (LiveKit server API ile `RemoveParticipant`) detaylandırılmamış. Sadece veritabanı kaydı yetersiz kalabilir.

### 2.5. Test Stratejisi
- **Durum:** `TODO.md` içinde test maddeleri var.
- **Eksik:** Edge Function'ların yerel ortamda nasıl test edileceği ve React Native tarafında LiveKit mock'laması ile ilgili yönergeler eksik.

## 3. Geliştirme Önerileri

### 3.1. Çağrı Altyapısı (CallKeep Entegrasyonu)
1-1 görüşmelerin profesyonelce çalışması için `react-native-callkeep` veya benzeri bir kütüphane entegre edilmelidir.
- **Öneri:** `apps/mobile` tarafına native arama arayüzü entegrasyonu ekleyin.
- **Aksiyon:** `MOBILE-INTEGRATION.md` dosyasına CallKeep kurulum ve yapılandırma adımlarını ekleyin.

### 3.2. Background Audio & Modes
Uygulama arka plandayken sesli odadaki konuşmanın devam etmesi veya gelen aramanın çalması için:
- **iOS:** `UIBackgroundModes` -> `audio`, `voip` yetkileri `app.json`'a eklenmeli.
- **Android:** Foreground Service kullanımı gerekebilir.
- **Aksiyon:** `app.config.ts` içine gerekli izinleri ekleyin.

### 3.3. Gelişmiş Moderasyon Akışı
Banlama işlemi için Edge Function güncellenmeli:
1. `live_session_bans` tablosuna kayıt at.
2. LiveKit Server API kullanarak kullanıcıyı odadan at (`disconnectParticipant`).
3. İstemci tarafında `RoomEvent.Disconnected` eventini dinleyip kullanıcıya "Banlandınız" mesajı göster.

### 3.4. Maliyet ve Kota Takibi
LiveKit Cloud "Build" planı limitleri (100 kullanıcı) hızlı dolabilir.
- **Öneri:** `live_sessions` tablosuna `peak_viewers` ve `total_duration` alanlarını periyodik olarak güncelleyen bir webhook handler ekleyin.
- **Aksiyon:** `livekit-webhook` fonksiyonunu, oturum bitiminde istatistikleri veritabanına yazacak şekilde güncelleyin.

### 3.5. Edge Function İyileştirmeleri
- **Rate Limiting:** Token üretim endpoint'ine IP bazlı rate limit ekleyin (DDoS koruması).
- **Validation:** Zod veya benzeri bir kütüphane ile request body validasyonunu standartlaştırın.

## 4. Sonraki Adımlar İçin Yol Haritası

1. **Öncelik 1:** `app.config.ts` ve `app.json` dosyalarına Background Audio ve VoIP izinlerini ekleyin.
2. **Öncelik 2:** `react-native-callkeep` veya Expo uyumlu alternatifini araştırıp entegrasyon planına ekleyin.
3. **Öncelik 3:** `livekit-webhook` fonksiyonunu detaylandırın (ban ve istatistik yönetimi için).
4. **Öncelik 4:** LiveKit Egress (Kayıt) için bir araştırma görevi (SPIKE) oluşturun.

Bu rapor doğrultusunda `TODO.md` dosyasını güncellemenizi öneririm.
