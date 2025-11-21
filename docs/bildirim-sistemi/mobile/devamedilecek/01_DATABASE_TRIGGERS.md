# Phase 8.1: Database Triggers - Detaylı Rehber

## 📋 Genel Bakış

Bildirim sisteminin kalbi, database'deki olayları yakalayan triggers'lardır. Toplam **15 farklı bildirim tipi** için trigger oluşturmalıyız.

---

## 🎯 Sıra

### 1️⃣ Sosyal Bildirimler (3 trigger)
- `on_new_follower` - Yeni takipçi
- `on_follow_back` - Takip geri
- `on_profile_mention` - Profil mention

### 2️⃣ Mesajlaşma Bildirimleri (3 trigger)
- `on_new_message` - Yeni mesaj
- `on_message_like` - Mesaj beğeni
- `on_message_reply` - Mesaj yanıtı

### 3️⃣ İçerik Bildirimleri (4 trigger)
- `on_content_like` - İçerik beğeni
- `on_content_comment` - İçerik yorum
- `on_content_share` - İçerik paylaş
- `on_content_update` - İçerik güncelle

### 4️⃣ Sistem Bildirimleri (3 trigger)
- `on_user_blocked` - Kullanıcı engellendi
- `on_system_alert` - Sistem uyarısı
- `on_security_alert` - Güvenlik uyarısı

### 5️⃣ Bakım Bildirimleri (2 trigger)
- `on_maintenance_start` - Bakım başladı
- `on_maintenance_end` - Bakım bitti

---

## 📝 Trigger Şablonu

```sql
CREATE OR REPLACE FUNCTION notify_on_[event]()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NEW.[recipient_column],           -- Bildirim alacak kişi
    NEW.[actor_column],               -- İşlemi yapan kişi
    '[notification_type]',            -- Bildirim tipi
    '[title_template]',               -- Başlık
    '[body_template]',                -- İçerik
    jsonb_build_object(               -- Ekstra veri
      'key', NEW.id,
      'other_key', NEW.other_value
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_[event]
AFTER INSERT ON [table_name]
FOR EACH ROW
EXECUTE FUNCTION notify_on_[event]();
```

---

## 🔧 Detaylı Implementasyon

### 1. on_new_follower

**Tetikleyici:** `follows` tablosuna yeni satır eklendiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NEW.following_id,                 -- Takip edilen kişi
    NEW.follower_id,                  -- Takip eden kişi
    'new_follower',
    'Yeni Takipçi',
    (SELECT username FROM auth.users WHERE id = NEW.follower_id) || ' seni takip etti',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'type', 'new_follower'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_follower
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_follower();
```

**Deep Link:** `/profile/{follower_id}`

---

### 2. on_follow_back

**Tetikleyici:** Takip geri yapıldığında (mutual follow)

```sql
CREATE OR REPLACE FUNCTION notify_on_follow_back()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer karşı taraf da takip ediyorsa
  IF EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = NEW.following_id 
    AND following_id = NEW.follower_id
  ) THEN
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      body,
      data,
      created_at
    ) VALUES (
      NEW.follower_id,
      NEW.following_id,
      'follow_back',
      'Takip Geri',
      (SELECT username FROM auth.users WHERE id = NEW.following_id) || ' seni takip etti',
      jsonb_build_object(
        'user_id', NEW.following_id,
        'type', 'follow_back'
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_back
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_follow_back();
```

**Deep Link:** `/profile/{user_id}`

---

### 3. on_profile_mention

**Tetikleyici:** Bio/profil açıklamasında mention yapıldığında

```sql
CREATE OR REPLACE FUNCTION notify_on_profile_mention()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_users UUID[];
  mentioned_user UUID;
BEGIN
  -- Bio'daki @username'leri bul
  mentioned_users := (
    SELECT array_agg(id)
    FROM auth.users
    WHERE username = ANY(
      regexp_matches(NEW.bio, '@(\w+)', 'g')
    )
  );

  -- Her mention edilen kişiye bildirim gönder
  FOREACH mentioned_user IN ARRAY mentioned_users
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      body,
      data,
      created_at
    ) VALUES (
      mentioned_user,
      NEW.id,
      'profile_mention',
      'Profil Mention',
      (SELECT username FROM auth.users WHERE id = NEW.id) || ' seni profilinde mention etti',
      jsonb_build_object(
        'user_id', NEW.id,
        'type', 'profile_mention'
      ),
      NOW()
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_mention
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.bio IS DISTINCT FROM NEW.bio)
EXECUTE FUNCTION notify_on_profile_mention();
```

**Deep Link:** `/profile/{user_id}`

---

### 4. on_user_blocked

**Tetikleyici:** Bir kullanıcı başka bir kullanıcıyı engellediğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_user_blocked()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NEW.blocked_user_id,
    NEW.blocker_id,
    'user_blocked',
    'Engellendi',
    (SELECT username FROM auth.users WHERE id = NEW.blocker_id) || ' seni engelledi',
    jsonb_build_object(
      'blocker_id', NEW.blocker_id,
      'type', 'user_blocked'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_blocked
AFTER INSERT ON blocks
FOR EACH ROW
EXECUTE FUNCTION notify_on_user_blocked();
```

**Deep Link:** `/(settings)/security`

---

### 5. on_new_message

**Tetikleyici:** Yeni mesaj eklendiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NEW.recipient_id,
    NEW.sender_id,
    'new_message',
    'Yeni Mesaj',
    NEW.content,
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'type', 'new_message'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_message();
```

**Deep Link:** `/messages/{sender_id}`

---

### 6. on_message_like

**Tetikleyici:** Mesaj beğenildiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_message_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    (SELECT sender_id FROM messages WHERE id = NEW.message_id),
    NEW.user_id,
    'message_like',
    'Mesaj Beğenildi',
    (SELECT username FROM auth.users WHERE id = NEW.user_id) || ' mesajını beğendi',
    jsonb_build_object(
      'message_id', NEW.message_id,
      'user_id', NEW.user_id,
      'type', 'message_like'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_like
AFTER INSERT ON message_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_message_like();
```

**Deep Link:** `/messages/{user_id}`

---

### 7. on_message_reply

**Tetikleyici:** Mesaja yanıt verildiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_message_reply()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    (SELECT sender_id FROM messages WHERE id = NEW.reply_to_id),
    NEW.sender_id,
    'message_reply',
    'Mesaja Yanıt',
    NEW.content,
    jsonb_build_object(
      'message_id', NEW.id,
      'reply_to_id', NEW.reply_to_id,
      'sender_id', NEW.sender_id,
      'type', 'message_reply'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_reply
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.reply_to_id IS NOT NULL)
EXECUTE FUNCTION notify_on_message_reply();
```

**Deep Link:** `/messages/{sender_id}`

---

### 8. on_content_like

**Tetikleyici:** İçerik beğenildiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_content_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    (SELECT user_id FROM content WHERE id = NEW.content_id),
    NEW.user_id,
    'content_like',
    'İçerik Beğenildi',
    (SELECT username FROM auth.users WHERE id = NEW.user_id) || ' içeriğini beğendi',
    jsonb_build_object(
      'content_id', NEW.content_id,
      'user_id', NEW.user_id,
      'type', 'content_like'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_like
AFTER INSERT ON content_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_content_like();
```

**Deep Link:** `/content/{content_id}`

---

### 9. on_content_comment

**Tetikleyici:** İçeriğe yorum yapıldığında

```sql
CREATE OR REPLACE FUNCTION notify_on_content_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    (SELECT user_id FROM content WHERE id = NEW.content_id),
    NEW.user_id,
    'content_comment',
    'İçeriğe Yorum',
    NEW.text,
    jsonb_build_object(
      'content_id', NEW.content_id,
      'comment_id', NEW.id,
      'user_id', NEW.user_id,
      'type', 'content_comment'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_content_comment();
```

**Deep Link:** `/content/{content_id}`

---

### 10. on_content_share

**Tetikleyici:** İçerik paylaşıldığında

```sql
CREATE OR REPLACE FUNCTION notify_on_content_share()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    (SELECT user_id FROM content WHERE id = NEW.content_id),
    NEW.user_id,
    'content_share',
    'İçerik Paylaşıldı',
    (SELECT username FROM auth.users WHERE id = NEW.user_id) || ' içeriğini paylaştı',
    jsonb_build_object(
      'content_id', NEW.content_id,
      'user_id', NEW.user_id,
      'type', 'content_share'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_share
AFTER INSERT ON shares
FOR EACH ROW
EXECUTE FUNCTION notify_on_content_share();
```

**Deep Link:** `/content/{content_id}`

---

### 11. on_content_update

**Tetikleyici:** İçerik güncellendiğinde (takipçilere bildir)

```sql
CREATE OR REPLACE FUNCTION notify_on_content_update()
RETURNS TRIGGER AS $$
DECLARE
  follower_id UUID;
BEGIN
  -- İçerik sahibinin takipçilerine bildir
  FOR follower_id IN
    SELECT follower_id FROM follows WHERE following_id = NEW.user_id
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      body,
      data,
      created_at
    ) VALUES (
      follower_id,
      NEW.user_id,
      'content_update',
      'İçerik Güncellendi',
      (SELECT username FROM auth.users WHERE id = NEW.user_id) || ' içeriğini güncelledi',
      jsonb_build_object(
        'content_id', NEW.id,
        'user_id', NEW.user_id,
        'type', 'content_update'
      ),
      NOW()
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_update
AFTER UPDATE ON content
FOR EACH ROW
WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
EXECUTE FUNCTION notify_on_content_update();
```

**Deep Link:** `/content/{content_id}`

---

### 12. on_system_alert

**Tetikleyici:** Sistem uyarısı gönderildiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_system_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NEW.recipient_id,
    NULL,
    'system_alert',
    'Sistem Uyarısı',
    NEW.message,
    jsonb_build_object(
      'alert_id', NEW.id,
      'type', 'system_alert'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_alert
AFTER INSERT ON system_alerts
FOR EACH ROW
EXECUTE FUNCTION notify_on_system_alert();
```

**Deep Link:** Custom URL veya app home

---

### 13. on_security_alert

**Tetikleyici:** Güvenlik uyarısı tetiklendiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_security_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NEW.user_id,
    NULL,
    'security_alert',
    'Güvenlik Uyarısı',
    NEW.message,
    jsonb_build_object(
      'alert_id', NEW.id,
      'type', 'security_alert'
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_security_alert
AFTER INSERT ON security_alerts
FOR EACH ROW
EXECUTE FUNCTION notify_on_security_alert();
```

**Deep Link:** `/(settings)/security`

---

### 14. on_maintenance_start

**Tetikleyici:** Bakım başladığında

```sql
CREATE OR REPLACE FUNCTION notify_on_maintenance_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Tüm aktif kullanıcılara bildir
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, data, created_at)
  SELECT 
    id,
    NULL,
    'maintenance_start',
    'Bakım Başladı',
    'Sistem bakımı başladı. Lütfen daha sonra tekrar deneyin.',
    jsonb_build_object('type', 'maintenance_start'),
    NOW()
  FROM auth.users;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintenance_start
AFTER INSERT ON maintenance_windows
FOR EACH ROW
WHEN (NEW.status = 'started')
EXECUTE FUNCTION notify_on_maintenance_start();
```

**Deep Link:** App home

---

### 15. on_maintenance_end

**Tetikleyici:** Bakım bittiğinde

```sql
CREATE OR REPLACE FUNCTION notify_on_maintenance_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Tüm aktif kullanıcılara bildir
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, data, created_at)
  SELECT 
    id,
    NULL,
    'maintenance_end',
    'Bakım Bitti',
    'Sistem bakımı tamamlandı. Artık normal şekilde kullanabilirsiniz.',
    jsonb_build_object('type', 'maintenance_end'),
    NOW()
  FROM auth.users;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintenance_end
AFTER UPDATE ON maintenance_windows
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION notify_on_maintenance_end();
```

**Deep Link:** App home

---

## 📋 Implementasyon Kontrol Listesi

- [ ] 1. on_new_follower
- [ ] 2. on_follow_back
- [ ] 3. on_profile_mention
- [ ] 4. on_user_blocked
- [ ] 5. on_new_message
- [ ] 6. on_message_like
- [ ] 7. on_message_reply
- [ ] 8. on_content_like
- [ ] 9. on_content_comment
- [ ] 10. on_content_share
- [ ] 11. on_content_update
- [ ] 12. on_system_alert
- [ ] 13. on_security_alert
- [ ] 14. on_maintenance_start
- [ ] 15. on_maintenance_end

---

## 🧪 Test Etme

Her trigger için test:

```sql
-- Örnek: on_new_follower test
INSERT INTO follows (follower_id, following_id, created_at)
VALUES ('user-1-id', 'user-2-id', NOW());

-- Bildirim oluşturuldu mu kontrol et
SELECT * FROM notifications 
WHERE type = 'new_follower' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ⚠️ Önemli Notlar

1. **Tablo Adları:** Gerçek tablo adlarıyla değiştir (follows, messages, content, vb.)
2. **Column Adları:** Projenin schema'sına göre ayarla
3. **RLS Policies:** Triggers'lar service_role ile çalışır, RLS'yi bypass eder
4. **Performance:** Çok fazla trigger varsa database load'u artabilir
5. **Notification Preferences:** Trigger'lar tercihler kontrol etmez, Edge Function'da kontrol et

---

**Sonraki Adım:** Phase 8.2 - EAS Setup & Physical Device Testing
