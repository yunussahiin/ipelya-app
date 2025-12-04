# 📿 Anonymous Confessions (Günah Çıkarma)

## 1. Konsept
Kullanıcıların (Fanların) Creator'a tamamen anonim olarak itiraflarını, fantezilerini veya sırlarını yazdığı bir kutu. Creator bu itirafları okur, (opsiyonel) yayınlar ve yorumlar.

**Amaç:** İçerik üretimi için malzeme sağlamak ve fanlarla "Sırdaş" olmak.

## 2. Kullanıcı Deneyimi (UX)
1.  **İtiraf:** Fan, Creator profilindeki "İtiraf Et" kutusuna yazar. (Ücretsiz veya sembolik 10 Coin).
2.  **Okuma:** Creator gelen kutusunda itirafları görür. Kimden geldiğini ASLA göremez.
3.  **Yanıt:** Creator beğendiği bir itirafı seçip "Story" olarak paylaşır ve üzerine kendi yorumunu (sesli/yazılı) ekler.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  -- user_id YOK! Tamamen anonim olması için user_id tutulmamalı veya hashlenmeli.
  -- Ancak spam engellemek için geçici bir 'session_hash' tutulabilir.
  
  content TEXT NOT NULL,
  
  is_publicized BOOLEAN DEFAULT false, -- Creator paylaştı mı?
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Güvenlik
Kullanıcı ID'si tutulmadığı için, bir kullanıcı taciz ederse engellemek zordur.
*   *Çözüm:* `user_id` tutulur ama Creator'a asla `SELECT` izni verilmez (RLS ile engellenir). Sadece Admin ve Sistem görebilir (Banlamak için).

## 4. Mobil Uygulama
*   **Kart Tasarımı:** İtiraflar, Instagram'daki "Soru Cevap" stickerları gibi estetik kartlar olarak görünür.
*   **Share to Story:** Tek tıkla Story editörüne atma özelliği.

## 5. Psikoloji
İnsanlar anonimken en karanlık sırlarını anlatmaya meyillidir. Bu özellik Shadow konseptinin "Katarsis" (Arınma) ayağını oluşturur.
