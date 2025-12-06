---
description: Next.js + React Native projeleri için otomatik Sentry analiz, problem tespiti ve çözüm iş akışları
auto_execution_mode: 3
---

# 1. 🎯 Amaç (Purpose)

Bu PRD, İpelya’nın Sentry altyapısını kullanarak:

- Hataları otomatik tespit eden  
- Araçları (MCP tools) uygun şekilde eşleyen  
- Root cause analiz eden  
- Çözüm öneren veya otomatik aksiyon alan  
- DSN, release, trace, event gibi Sentry varlıklarını yöneten  
- Geliştiricinin hem web hem mobil projedeki operasyon yükünü azaltan  

**Gelişmiş otomasyon iş akışları** tasarlamak için hazırlanmıştır.

---

# 2. 📌 Kapsam (Scope)

Dahil:
- Sentry MCP tools otomatik tanıma  
- Hata tespiti (error spike, recurring issues, user-impacting failures)  
- Seer ile otomatik root cause analysis  
- Issue çözme veya assign etme  
- DSN yönetimi  
- Release geçmişi & deploy analiz  
- Event count & aggregation  
- Trace inceleme  
- Attachment alma  

Hariç:
- CI/CD pipeline otomatik deploy işlemleri  
- Slack/Discord bildirim sistemleri (ileride eklenebilir)

---

# 3. 🧠 Sistem Bilgileri (Memory’den Gelen Sabitler)

organizationSlug: ipelya  
teamSlug: ipelya  
regionUrl: https://de.sentry.io  
web projectSlug: ipelya-nextjs  
mobile projectSlug: ipelya-react-native  
webUrl: https://ipelya.sentry.io  

Workflow’larda bu bilgiler otomatik kullanılır.

---

# 4. 🚨 Problem Tespit Kuralları (Detection Rules)

## 4.1 Error Spike Detection
- Son 1 saatteki error sayısı, 24 saat ortalamasının %50 üzerinde → Spike

## 4.2 New Critical Error Detection
- Severity: critical / fatal  
- Last seen < 10 minutes → Yeni kritik hata

## 4.3 Recurring Issues
- Aynı hata 5+ kullanıcıya etkiliyorsa → recurring

## 4.4 Performance Regression Detection
- Mean transaction time → %150 artış

## 4.5 DSN Misconfiguration Detection
- DSN mevcut ama telemetri yok → misconfigured

---

# 5. 🛠 Çözüm Kuralları (Solution Rules)

## 5.1 Root Cause Analysis
mcp5_analyze_issue_with_seer → Fix önerisi + sebep analizi

## 5.2 Auto Assign Rule
- Web error → team:web  
- Mobile crash → team:mobile  

## 5.3 Auto Resolve Rule
- Seer sonucu "fix applied or non-breaking" → resolve

## 5.4 Developer Summary Report
- Her workflow sonunda summarize

---

# 6. 🧩 Workflow Mimarisi

Detection → Analysis → Action

---

# 7. 🧪 Kullanıcı Senaryoları

US-01: /sentry-debug-issue  
US-02: /sentry-events query="how many errors today"  
US-03: /sentry-dsn-mobile  
US-04: /sentry-auto-detect  

---

# 8. 📜 Workflow Definitions

## 8.1 /sentry-auto-detect
```
1. errorsLastHour = mcp5_search_events ("count of errors last hour")
2. errorsLastDay = mcp5_search_events ("count of errors last 24 hours")
3. if spike: emit "Spike detected"
4. mcp5_search_issues ("unresolved critical issues last 10 minutes")
5. mcp5_search_events ("errors affecting 5+ users")
6. summarize
```

## 8.2 /sentry-debug-issue
```
1. mcp5_get_issue_details
2. mcp5_analyze_issue_with_seer (deep analysis)
3. summarize
```

## 8.3 /sentry-resolve
```
if assignTo: update + resolve
else: resolve
```

## 8.4 /sentry-dsn-nextjs
```
mcp5_find_dsns (ipelya-nextjs)
```

## 8.5 /sentry-dsn-mobile
```
mcp5_find_dsns (ipelya-react-native)
```

## 8.6 /sentry-trace
```
mcp5_get_trace_details
```

---

# 9. ✔ Başarı Kriterleri

- Araçları tanır  
- Hata türlerini sınıflandırır  
- Kritik problemleri tespit eder  
- Root cause analiz eder  
- Gerektiğinde otomatik resolve eder  
- Sonunda özet rapor verir  

---

# 10. 📦 Future Improvements

- Slack notifications  
- Issue auto-labeling  
- CI/CD integration  
- SLO alerting  

---