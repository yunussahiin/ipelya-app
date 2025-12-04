# 🔗 Chain Stories (Zincirleme Hikaye)

## 1. Konsept
Bir kullanıcının başlattığı hikayeye, diğer kullanıcıların kendi video/fotoğraflarını ekleyerek (Append) zinciri uzatması. TikTok'taki "Duet/Stitch" veya Instagram'daki "Add Yours" özelliğinin daha organize ve hikaye odaklı hali.

**Örnek:** "Bugün ne yedin?" zinciri. Herkes yemeğini ekler ve tek bir uzun Story gibi izlenir.

## 2. Kullanıcı Deneyimi (UX)
1.  **Başlatma:** Kullanıcı bir Story atar ve "Zincir Başlat" etiketini seçer. Konuyu yazar (örn: "Manzaranı Göster").
2.  **Katılım:** İzleyenler "Zincire Ekle" butonuna basar. Kendi storylerini çekerler.
3.  **İzleme:** Zincir etiketi tıklandığında, o zincire eklenen **tüm** storyler arka arkaya (Playlist gibi) oynatılır.
4.  **Viralite:** Zincir ne kadar uzarsa, başlatan kişi (Originator) o kadar çok görüntülenme alır.

## 3. Teknik Mimari

### Database
Hiyerarşik bir yapı (Tree) yerine, düz bir liste ve `parent_chain_id` referansı yeterlidir.

```sql
CREATE TABLE story_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  sticker_style TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stories
ADD COLUMN chain_id UUID REFERENCES story_chains(id);
```

### Logic
*   `get_chain_stories(chain_id)`: O zincire ait tüm storyleri `created_at` sırasına göre getirir.
*   **Moderasyon:** Zincire alakasız veya uygunsuz içerik eklenirse, zincir sahibi (veya admin) o halkayı çıkarabilmelidir.

## 4. Mobil Uygulama
*   **Player:** Standart StoryViewer, ancak "Sonraki Kullanıcı" yerine "Zincirdeki Sonraki Story"ye geçer.
*   **Sticker:** Story üzerinde tıklanabilir bir "Zincir Sticker"ı (örn: 🔗 Manzaranı Göster).

## 5. Büyüme (Growth)
Bu özellik, kullanıcıların içerik üretme bariyerini düşürür. "Ne paylaşsam?" diye düşünmek yerine var olan bir akıma katılırlar.
