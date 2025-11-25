 Expo + React Native + Supabase ile Tam Ödeme & Token Sistemi Entegrasyon Dokümanı

Bu dokümanı direkt canvas’a alıp proje kılavuzu olarak kullanabilirsin.

⸻

🧩 1. Expo’da Kullanabileceğin Temel Paketler + Linkler

⭐ 1) Store içi ödemeler (iOS & Android)

➥ react-native-iap (Expo Prebuild ile uyumlu)
	•	(Resmi repo) https://github.com/dooboolab/react-native-iap
	•	Expo’da prebuild kullanıyorsun → tamamen uyumlu.

Expo Alternatifi (yeni)

➥ expo-in-app-purchases (ESKİDİ, tavsiye etmiyorum ama mümkün)
https://docs.expo.dev/versions/latest/sdk/in-app-purchases/

➡️ Apple/Google politikaları sebebiyle en stabil çözüm: react-native-iap

⸻

⭐ 2) Sunucu Tarafı Doğrulama (Abonelik & Token)

Supabase kendi başına Apple/Google receipt doğrulaması yapamaz.
Aşağıdaki paketleri kendi edge function (Deno) veya Node backend’inde kullanırsın:

Apple Receipt Validation
	•	https://github.com/voltrue2/in-app-purchase
	•	https://github.com/awaresystems/node-apple-receipt-verify

Google Play Developer API
	•	https://github.com/googleapis/google-api-nodejs-client
	•	Google APİ docs: https://developers.google.com/android-publisher

⸻

⭐ 3) Expo için Animasyonlu Hediye Gönderme / Canvas

Expo + RN içinde “Canvas tipi animasyon” için:

react-native-skia (Canvas)
	•	https://shopify.github.io/react-native-skia/
➡️ Hediye animasyonları, gönderim efektleri için en profesyonel çözüm.

react-native-reanimated
	•	https://docs.swmansion.com/react-native-reanimated/
➡️ Hediye efektleri & açılan paket animasyonları için.

⸻

⭐ 4) Supabase Paketleri

JavaScript Client (React Native için)
	•	https://supabase.com/docs/reference/javascript

Supabase Edge Functions (Deno)
	•	https://supabase.com/docs/guides/functions

Realtime API (Hediye gönderim bildirimi için)
	•	https://supabase.com/docs/guides/realtime

⸻

⸻

📦 2. EXPO + Supabase içinde önerilen tam mimari

Aşağıda İpelya gibi çok bileşenli bir app için ideal dizayn:

⸻

🏗 2.1 Uygulama Mimarisi (Frontend) Bu tamamen örnek olarak verildi bizim yapımıza göre düzenlenmeli
src/
  api/
    purchases.ts      → Store işlemleri
    gifts.ts          → Hediye API
    tokens.ts         → Token hesaplama
  components/
    GiftAnimations/   → Skia Canvas animasyonları
  hooks/
    useSubscription.ts
    useTokens.ts
  services/
    supabase.ts       → Supabase client
  screens/
    StoreScreen.tsx
    ProfileScreen.tsx

    🔧 2.2 Backend Mimarisi (Supabase Edge Functions)
    functions/
  verify-apple-receipt/
  verify-google-purchase/
  grant-tokens/
  webhook-apple/
  webhook-google/
  gift-send/

  Roles:

✔ token-verification

Apple & Google doğrulama

✔ token-grant

Satın alım başarılı → DB’de token ekle

✔ subscription-status

Abonelik statüsü realtime güncelle

✔ gift-send

Hediye gönderiminde token düş + realtime notify


💾 2.3 Supabase Tabloları (Tamamen örnek olarak verildi yapımıza göre analiz edip geliştirmeliyiz)

users
	•	id
	•	premium_status (“free”, “active”, “expired”)
	•	token_balance

purchases
	•	id
	•	user_id
	•	store (“apple” | “google”)
	•	product_id
	•	purchase_token
	•	status (“pending”, “validated”, “error”)
	•	created_at

gifts
	•	id
	•	sender_id
	•	receiver_id
	•	gift_type
	•	token_cost
	•	timestamp

    🛒 3. Store (Abonelik & Token Satışı) Tanımları

Apple
	•	App Store Connect > Features > In-App Purchases
	•	Auto-Renewable Subscription
	•	Consumable (token paketleri)

Android
	•	Google Play Console > Products
	•	Subscriptions
	•	In-App Products (Managed / Consumable)

📱 4. React Native – Satın Alma Akışı (react-native-iap)

🔹 1. Ürünleri al
const products = await getProducts(['premium_monthly', 'tokens_100', 'tokens_500']);
🔹 2. Purchase request
await requestPurchase({ sku: 'tokens_100' });
🔹 3. Listener (Kritik!)
purchaseUpdatedListener(async purchase => {
  const receipt = purchase.transactionReceipt;

  await supabase.functions.invoke('verify-apple-receipt', {
    body: { receipt, userId }
  });

  await finishTransaction(purchase);
});

🧮 5. Supabase Backend – Apple Doğrulama (Edge Function)
import { serve } from "https://deno.land/std/http/server.ts";
import iap from "npm:in-app-purchase";

serve(async (req) => {
  const { receipt, userId } = await req.json();

  await iap.setup();

  const result = await iap.validate(iap.APPLE, receipt);

  const isValidated = iap.isValidated(result);

  if (!isValidated) return new Response("invalid", { status: 400 });

  // token tanımla
  await supabase
    .from('users')
    .update({ token_balance: sql`token_balance + 100` })
    .eq('id', userId);

  return new Response("ok");
});

🎁 6. Hediye Gönderim Akışı

Frontend:
	•	Kullanıcı bir hediye seçer
	•	Token cost backend’e gider
	•	Backend token düşer
	•	Realtime ile karşı tarafa “gift_received” event gönderilir

Backend (gift-send function örneği geliştirilecek):
await supabase.rpc("decrement_token_balance", { user_id: senderId, amount: cost })

await supabase.from("gifts").insert({
  sender_id,
  receiver_id,
  gift_type,
  token_cost
});

supabase.realtime.send({
  event: "gift",
  payload: { sender_id, gift_type }
}); 
✨ 7. Canvas (react-native-skia) ile Hediye Animasyonu

Örnek:
import { Canvas, Circle, Group } from "@shopify/react-native-skia";

export function GiftAnimation() {
  return (
    <Canvas style={{ width: 200, height: 200 }}>
      <Group>
        <Circle cx={100} cy={100} r={40} color="#FF69B4" />
      </Group>
    </Canvas>
  );
}


🧷 8. Fraud & Double-Spend Koruma
	•	Her receipt purchases table’da tutulur
	•	Aynı receipt tekrar işlenmez
	•	Google & Apple server validation zorunlu
	•	Token işlemleri tamamen server-side
	•	Token düşme işlemi SQL RPC ile yapılır → atomik

Supabase RPC örneği (atomik):

create or replace function decrement_token_balance(user_id uuid, amount int)
returns void as $$
begin
  update users
  set token_balance = token_balance - amount
  where id = user_id;
end;
$$ language plpgsql;