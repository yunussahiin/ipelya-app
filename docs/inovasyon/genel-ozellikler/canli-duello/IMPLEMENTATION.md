# ⚔️ Live PK (Canlı Düello)

## 1. Konsept
İki kullanıcının (genelde Creator) canlı yayında ekranı ikiye bölerek (Split Screen) 5 dakikalık bir yarışma yapması. Kazananı, izleyicilerin o süre içinde gönderdiği **Hediye (Coin)** miktarı belirler.

**Amaç:** Rekabet duygusuyla hediye gelirlerini (Revenue) maksimize etmek. TikTok'un en çok kazandıran modelidir.

## 2. Kullanıcı Deneyimi (UX)
1.  **Davet:** Yayıncı A, Yayıncı B'ye "PK İsteği" atar.
2.  **Başlangıç:** Ekran ikiye bölünür. Ortada bir "Güç Çubuğu" (Power Bar) belirir.
3.  **Savaş:**
    *   A'nın izleyicileri hediye attıkça çubuk A'ya doğru dolar (Mavi).
    *   B'nin izleyicileri hediye attıkça çubuk B'ye doğru dolar (Kırmızı).
4.  **Cezalı Oyun:** Süre bittiğinde kaybeden taraf, kazananın belirlediği komik bir cezayı (örn: Yüzüne ruj sürmek) yapar.

## 3. Teknik Mimari (LiveKit)

### Oda Yönetimi
*   Mevcut LiveKit odaları birleştirilmez, bunun yerine Client tarafında iki video stream yan yana gösterilir (Composite View).
*   Veya LiveKit'in "Egress" özelliği ile sunucu tarafında birleştirilebilir (Daha maliyetli).

### Realtime Score
*   Supabase Realtime ile anlık hediye sayacı senkronize edilir.
*   Gecikme (Latency) çok önemlidir, skor anlık değişmelidir.

### Database
```sql
CREATE TABLE live_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_a_id UUID NOT NULL,
  creator_b_id UUID NOT NULL,
  
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'active', -- active, finished
  winner_id UUID,
  
  started_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ
);
```

## 4. Mobil Uygulama
*   **UI:** Ekranın üstünde animasyonlu VS (Versus) barı.
*   **Efektler:** Son saniyelerde (Last 10s) müzik hızlanır, ekran titrer.
*   **MVP:** Başlangıçta sadece sesli PK yapılabilir, video sonra eklenebilir.

## 5. Psikoloji
"Bizim takım kazansın" (Tribalism) psikolojisi. İzleyiciler yayıncıyı değil, kendi topluluklarının onurunu korumak için para harcar.
