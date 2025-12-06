# 🎭 Burner Avatars (Kullan-At Kimlikler) - Teknik Analiz ve Uygulama Rehberi

## 1. Vizyon ve Konsept
**"Her sohbet için yeni bir 'Sen'."**

Burner Avatars, dijital iz bırakma korkusu olmadan sosyalleşmeyi sağlar. Kullanıcı tek bir dokunuşla yapay zeka tarafından üretilmiş, tamamen inandırıcı ama aslında var olmayan bir "Persona" (Maske) yaratır. Bu persona, görevi bittiğinde (süre dolduğunda veya sohbet bittiğinde) kendini imha eder.

**Temel Vaat:** Gerçek profiliniz temiz kalır. "Gölge" aktiviteleriniz, geçici hayalet profiller üzerinde yaşanır ve yok olur.

---

## 2. Kullanıcı Deneyimi (UX)
1.  **Generate:** "Yeni Av Tarlası"na girerken kullanıcı "Create Burner" butonuna basar.
2.  **AI Magic:** 3 saniye içinde:
    *   **Yüz:** AI tarafından üretilmiş eşsiz bir yüz (ThisPersonDoesNotExist benzeri).
    *   **İsim:** Soyut ama havalı bir takma ad (örn: *NeonDrifter, VoidWalker*).
    *   **Bio:** Kısa, gizemli bir açıklama.
3.  **Engage:** Bu profille sohbete girer, mesajlaşır.
4.  **Burn:** "Leave" butonuna bastığı an, veya 1 saat dolduğunda, profil ve attığı tüm mesajlar veritabanından kalıcı olarak silinir.

---

## 3. Teknoloji Stack

| Bileşen | Teknoloji | Amaç |
| :--- | :--- | :--- |
| **Image Gen** | Stable Diffusion (via Replicate API) | Eşsiz avatar yüzleri üretmek için. |
| **Text Gen** | GPT-4o-mini (via OpenAI) | Tutarlı ve ilgi çekici takma isimler ve bio'lar üretmek için. |
| **Database** | Supabase Row Level Security (RLS) | Verinin sadece o anki oturumda erişilebilir olmasını sağlamak. |
| **Cleanup** | Supabase `pg_cron` | Süresi dolan (Expired) burner profilleri otomatik temizlemek. |

---

## 4. Supabase Veritabanı Tasarımı

Burner profilleri ana `profiles` tablosunda değil, ayrı ve geçici bir tabloda tutulur.

### Tablo: `burner_profiles`
```sql
create table public.burner_profiles (
  id uuid default gen_random_uuid() primary key,
  real_user_id uuid references auth.users(id), -- Gerçek kullanıcı ile gizli bağ
  temp_username text not null,
  temp_avatar_url text not null,
  bio text,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'), -- Otomatik imha süresi
  is_active boolean default true
);
```

### Otomatik Temizlik (Self-Destruct)
Supabase üzerinde bir veritabanı uzantısı (`pg_cron`) ile periyodik temizlik.

```sql
-- Her 5 dakikada bir çalışır
select cron.schedule(
  'cleanup-burners',
  '*/5 * * * *', 
  $$
    delete from public.burner_profiles where expires_at < now();
    -- İlişkili mesajları da cascade ile siler (foreign key varsa)
  $$
);
```

---

## 5. Uygulama Adımları (Implementation Guide)

### Adım 1: Edge Function ile Avatar Üretimi

Mobil cihazın pilini yormamak için üretim bulutta yapılır.

```typescript
// supabase/functions/generate-burner/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "openai";

serve(async (req) => {
  // 1. Text Generate (İsim & Bio)
  const gptResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "Generate a cool, cyberpunk-style mysterious username and a short 1-sentence bio.",
    max_tokens: 50
  });
  const { username, bio } = parseGPT(gptResponse);

  // 2. Image Generate (Avatar)
  const imageResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    body: JSON.stringify({
      version: "stable-diffusion-v2-1",
      input: { prompt: "cyberpunk styles portrait, mysterious face, digital art, 8k" }
    }),
    headers: { Authorization: `Token ${REPLICATE_API_KEY}` }
  });
  
  // 3. DB'ye Kayıt
  const { data } = await supabase.from('burner_profiles').insert({
    temp_username: username,
    bio: bio,
    temp_avatar_url: imageResponse.output_url
  }).select().single();

  return new Response(JSON.stringify(data));
});
```

### Adım 2: UI Entegrasyonu (`BurnerMode.tsx`)

Kullanıcının gerçek profili yerine Burner profilini aktif hale getiren hook ve UI.

```tsx
export const BurnerModeToggle = () => {
  const { createBurner, currentBurner, timeLeft } = useBurnerStore();

  if (currentBurner) {
    return (
      <View style={styles.activeContainer}>
        <Image source={{ uri: currentBurner.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{currentBurner.username}</Text>
        <Text style={styles.timer}>Auto-Destruct in: {formatTime(timeLeft)}</Text>
        <Button onPress={destructNow} title="IMMEDIATE BURNOUT 🔥" />
      </View>
    );
  }

  return (
    <Button onPress={createBurner} title="Go Ghost 👻" />
  );
};
```

---

## 6. Sosyal Mühendislik & Güvenlik

*   **Troll Limiti:** Bir kullanıcı günde en fazla 3 Burner yaratabilir (Spam önlemi).
*   **Shadow Ban:** Eğer bir Burner profil raporlanırsa, kullanıcının **gerçek** profili de (gizli bir skorla) cezalandırılır. Böylece anonimlik, kötü niyetli davranışa kalkan olmaz.

## 7. Roadmap
1.  **Faz 1:** Random Text & Stock Avatar. (Hızlı MVP).
2.  **Faz 2:** Generative AI Entegrasyonu. (Replicate/OpenAI bağlama).
3.  **Faz 3:** "Shared Hallucination". Burner profilinizin sadece belirli bir grupta geçerli olması ve gruptan çıkınca yok olması.
