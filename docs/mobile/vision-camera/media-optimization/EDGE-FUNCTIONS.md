# Edge Functions

> **Son Güncelleme:** 27 Kasım 2025

## 1. queue-media-job (v3)

Queue'ya media optimization job ekler. Sadece preset adı gönderir, options worker'a bırakılır.

### Endpoint
```
POST /functions/v1/queue-media-job
```

### Request Body
```json
{
  "job_type": "image_optimize",
  "user_id": "uuid",
  "source_path": "userId/timestamp_random.jpg",
  "message_id": "uuid (optional)",
  "preset": "chat | post | story | profile"
}
```

### Presets (Worker'da tanımlı)
| Preset    | Max Width | Quality | Kullanım             |
| --------- | --------- | ------- | -------------------- |
| `chat`    | **1920**  | 85      | Mesajlaşma (Full HD) |
| `post`    | 1080      | 88      | Feed post            |
| `story`   | 1080      | 85      | Story                |
| `profile` | 500       | 90      | Profil fotoğrafı     |

### Response
```json
{
  "success": true,
  "message_id": 25,
  "preset": "chat"
}
```

---

## 2. media-worker (v12)

Queue'daki job'ları işler, ImageMagick WASM ile optimize eder.

### Endpoint
```
POST /functions/v1/media-worker
```

### İşlem Adımları
1. Queue'dan mesaj oku (max 2, RAM için)
2. Storage'dan dosyayı indir
3. ImageMagick ile işle:
   - **Auto-Orient** (EXIF rotation fix) ← YENİ!
   - Smart Resize (oran koruma)
   - Strip EXIF metadata (privacy)
   - Quality ayarla
4. Optimized dosyayı upload et (üzerine yaz)
5. DB'yi güncelle (is_optimized, optimization_info)
6. Queue'dan mesajı sil

### Response
```json
{
  "processed": 1,
  "failed": 0,
  "total_savings_bytes": 515750,
  "jobs": [
    {
      "msg_id": "25",
      "status": "success",
      "original": "2112x1188",
      "optimized": "1920x1080",
      "ratio": "landscape",
      "savings": "504KB (63%)"
    }
  ],
  "duration_ms": 1437
}
```

### Optimizasyon Kuralları
- **100KB altı** → Skip (zaten küçük)
- **%5 altı tasarruf** → Orijinali koru
- **Auto-Orient** → EXIF rotation'a göre pikselleri döndür
- **EXIF strip** → Konum/cihaz bilgisi temizlenir

### Oran Algılama
| Oran          | Koşul        | Örnek       |
| ------------- | ------------ | ----------- |
| **story**     | ratio >= 1.7 | 9:16 dikey  |
| **portrait**  | ratio >= 1.2 | 4:5 dikey   |
| **square**    | ratio >= 0.9 | 1:1 kare    |
| **landscape** | ratio >= 0.5 | 16:9 yatay  |
| **ultrawide** | ratio < 0.5  | 21:9 sinema |

---

## 3. Deployment

```bash
# MCP ile deploy
mcp4_deploy_edge_function({
  name: "media-worker",
  files: [{ name: "index.ts", content: "..." }]
})
```

### Versiyon Geçmişi
| Version | Değişiklik                                                  |
| ------- | ----------------------------------------------------------- |
| **v12** | Auto-Orient fix (EXIF rotation), yüksek çözünürlük (1920px) |
| v11     | Yüksek çözünürlük denemesi                                  |
| v10     | Platform standartlarına crop (geri alındı)                  |
| v9      | Platform standartları, preset desteği                       |
| v8      | ImageMagick WASM düzeltmeleri                               |
| v7      | İlk çalışan versiyon                                        |

### queue-media-job Versiyon Geçmişi
| Version | Değişiklik                                 |
| ------- | ------------------------------------------ |
| **v3**  | Options gönderme kaldırıldı, sadece preset |
| v2      | Preset desteği eklendi                     |
| v1      | İlk versiyon                               |
