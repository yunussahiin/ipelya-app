# PGMQ Queue System

## Genel Bakış

PostgreSQL Message Queue (PGMQ) kullanarak asenkron media işleme.

## Queue Yapısı

### Queue Adı
```
media_processing_queue
```

### Mesaj Formatı
```json
{
  "job_type": "image_optimize",
  "user_id": "9143806b-1467-4a82-af7d-195239dc0a77",
  "source_path": "userId/1764202838039_yk4wjn.jpg",
  "message_id": "a80f87a0-6672-419e-b455-530695a5662c",
  "preset": "chat",
  "options": {
    "width": 1080,
    "quality": 85
  },
  "created_at": "2025-11-27T00:20:39.000Z"
}
```

## SQL Fonksiyonları

### Queue Oluşturma
```sql
SELECT pgmq.create('media_processing_queue');
```

### Mesaj Gönderme
```sql
SELECT pgmq.send(
  'media_processing_queue',
  jsonb_build_object(
    'job_type', 'image_optimize',
    'user_id', '...',
    'source_path', '...',
    'preset', 'chat'
  )
);
```

### Mesaj Okuma
```sql
-- 2 mesaj oku, 300 saniye visibility timeout
SELECT * FROM pgmq.read('media_processing_queue', 300, 2);
```

### Mesaj Silme
```sql
SELECT pgmq.delete('media_processing_queue', msg_id);
```

### Queue Metrikleri
```sql
SELECT * FROM pgmq.metrics('media_processing_queue');
```

## RPC Wrapper'lar

Supabase client için RPC fonksiyonları:

```sql
-- pgmq_send
CREATE OR REPLACE FUNCTION public.pgmq_send(queue_name text, message jsonb)
RETURNS bigint AS $$
  SELECT pgmq.send(queue_name, message);
$$ LANGUAGE sql SECURITY DEFINER;

-- pgmq_read
CREATE OR REPLACE FUNCTION public.pgmq_read(queue_name text, vt integer, qty integer)
RETURNS SETOF pgmq.message_record AS $$
  SELECT * FROM pgmq.read(queue_name, vt, qty);
$$ LANGUAGE sql SECURITY DEFINER;

-- pgmq_delete
CREATE OR REPLACE FUNCTION public.pgmq_delete(queue_name text, msg_id bigint)
RETURNS boolean AS $$
  SELECT pgmq.delete(queue_name, msg_id);
$$ LANGUAGE sql SECURITY DEFINER;
```

## Database Schema

### messages Tablosu Eklentileri
```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_optimized boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS optimization_info jsonb;
```

### optimization_info Formatı
```json
{
  "original_size_bytes": 1779000,
  "optimized_size_bytes": 54000,
  "savings_bytes": 1725000,
  "savings_percent": 97.0,
  "original_dimensions": "2112x1188",
  "optimized_dimensions": "1080x608",
  "format": "jpeg",
  "quality": 85,
  "processed_at": "2025-11-27T00:20:45.000Z",
  "worker_version": "9.0.0"
}
```

## Monitoring

### Queue Durumu
```sql
SELECT 
  queue_length,
  newest_msg_age_sec,
  oldest_msg_age_sec,
  total_messages
FROM pgmq.metrics('media_processing_queue');
```

### Optimize Edilmiş Mesajlar
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_optimized = true) as optimized,
  COUNT(*) FILTER (WHERE is_optimized = false AND media_url IS NOT NULL) as pending
FROM messages;
```
