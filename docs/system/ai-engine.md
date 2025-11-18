---
title: AI Engine ve Prompt Blueprint
description: AI Fantasy, Avatar Mode, ASMR Voice ve Vibe Match sistemlerinin teknik tasarımı
---

# AI Engine

## 1. Modül Çeşitleri
1. **Fantasy Generator**: Hikâye, görsel ve mini video üretimi.
2. **Avatar Mode**: Kimlik korumalı AI persona ve video üretimi.
3. **ASMR Voice AI**: Ses temizleme, tonlama, morphing.
4. **Vibe Match Embeddings**: Creator & kullanıcı davranış embedding'leri.
5. **Behavior Scoring**: Kullanıcı aksiyonlarını tek descriptor'a çevirme.
6. **DMCA Reverse Search**: AI destekli kopya içerik tarama.

## 2. Prompt Blueprint Özeti
| Modül            | Prompt Kuralları                                               |
| ---------------- | -------------------------------------------------------------- |
| Story Mode       | 80-160 kelime, ikinci şahıs, sinematik detay, cliffhanger.     |
| Image Mode       | Cinematic ışık, güvenli içerik, atmosfer/vibe + pose.          |
| Video Mode       | 10-15sn, kamera hareketi + ışık + duygu tanımı.                |
| Avatar Mode      | Kimliksiz, creator vibe'ını taşıyan persona tanımı.            |
| ASMR Voice       | Gürültü temizleme, sıcak ton, hafif nefes, isteğe bağlı morph. |
| Vibe Embedding   | 40 kelimelik descriptor, duygu + enerji + fantezi yönü.        |
| Behavior Scoring | 20-30 kelimede ilgi, tempo, cesaret, dikkat modeli.            |

## 3. Servis Çağrıları
- **Edge Functions**: `generate-fantasy`, `avatar-mode`, `asmr-enhance`, `embedding-vibe`, `dmca-scan` (isimlendirme blueprint'e göre).
- **AI Providers**:
  - OpenAI GPT-4.1/4o-mini → Story & behavior.
  - OpenAI Image / SDXL / Flux → Image prompts.
  - Pika / Runway / Luma → Video prompt'larını işler.
  - ElevenLabs + DSP zinciri → Ses smoothing ve morphing.
  - OpenAI Whisper → Ses metinleştirme.

## 4. Veri Akışı
1. `ai_fantasy_requests` insert → Edge Function AI'yi çağırır.
2. Sonuçlar `ai_fantasy_outputs` + `ai-content/` bucket'larına kaydedilir.
3. `ai_behavior_logs` ve `embeddings_profiles` pgvector alanları güncellenir.
4. Realtime event ile istemci output hazır bilgisini alır.

## 5. Güvenlik ve Uyumluluk
- Prompt'lar legal/explicit sınırlarına göre filtrelenir (Edge Function içinde guard layer).
- DMCA scan sonuçları `dmca_reports` tablosuna JSON olarak kaydedilir.
- Avatar Mode prompt'ları gerçek yüz/pattern içermez; hair color & vibe referansı ile kimliksizlik korunur.

## 6. İstemci Entegrasyonu
- Mobil AI sayfası `packages/hooks/useFantasy` ile request/status kontrol eder.
- Web paneli, AI taleplerini ve çıktıları creator dashboard'da listeler.
- ASMR ses düzenleme talepleri uploader flow'una entegre edilir.

Bu belge, AI yeteneklerinin prompt standardı, servis entegrasyonu ve Supabase kayıt modelini tek noktada özetler.
