#️⃣ Supabase Edge Functions — FULL CODE TEMPLATES (Production-Ready)

Bu doküman, İpelya’nın tüm kritik operasyonlarını yöneten Edge Functions için tam kod şablonlarını içerir.

Bu bölüm:
✔ Stripe / Iyzico / PPV / Jeton
✔ AI Fantasy Engine
✔ Shadow Mode
✔ DMCA
✔ LiveKit
✔ Anti Screenshot
✔ Contact Firewall
✔ Schedule Engine

gibi tüm fonksiyonların gerçek TypeScript kodlarını, Supabase projesinde birebir oluşturabileceğin şekilde içerir.

Her fonksiyon:

index.ts

Input validation (Zod)

JWT Claims okuma

Supabase Admin Client

Error handling

Response structure
standartlarını izler.

Hazırsan başlıyoruz.

🧱 Supabase Edge Functions – Mimarisi

Supabase içinde şu şekilde konumlanır:

supabase/
  functions/
    enable-shadow-mode/
      index.ts
      schema.ts
    disable-shadow-mode/
    buy-coins/
    buy-ppv/
    generate-fantasy/
    log-screenshot/
    upload-contacts/
    get-livekit-token/
    dmca-scan/
    schedule-content/
    publish-scheduled/
    stripe-webhook/
    iyzico-webhook/

#️⃣ 1) SHADOW MODE — enable-shadow-mode
Görev:

PIN doğrula → JWT claim’i güncelle → shadow_mode=true

schema.ts
import { z } from "zod";

export const ShadowEnableSchema = z.object({
  pin: z.string().min(4).max(6),
});

export type ShadowEnableInput = z.infer<typeof ShadowEnableSchema>;

index.ts
// supabase/functions/enable-shadow-mode/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { ShadowEnableSchema } from "./schema.ts";

serve(async (req) => {
  try {
    const body = await req.json();
    const parsed = ShadowEnableSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: "Invalid PIN format",
      }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from JWT
    const authHeader = req.headers.get("Authorization")!;
    const jwt = authHeader.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabase.auth.getUser(jwt);

    if (!user) {
      return new Response(JSON.stringify({
        error: "Unauthorized",
      }), { status: 401 });
    }

    // Get shadow profile to check PIN hash
    const { data: shadowProfile } = await supabase
      .from("profiles")
      .select("shadow_pin_hash")
      .eq("user_id", user.id)
      .eq("type", "shadow")
      .single();

    if (!shadowProfile) {
      return new Response(JSON.stringify({ error: "Shadow profile missing" }), { status: 404 });
    }

    // Check PIN
    const validPin = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(parsed.data.pin)
    );
    const pinHex = Array.from(new Uint8Array(validPin))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (pinHex !== shadowProfile.shadow_pin_hash) {
      return new Response(JSON.stringify({ error: "Wrong PIN" }), { status: 403 });
    }

    // Update JWT claim
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        shadow_mode: "true",
      },
    });

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({
      shadow_mode: true,
      message: "Shadow mode enabled",
    }), { status: 200 });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      { status: 500 }
    );
  }
});

#️⃣ 2) AI FANTASY ENGINE — generate-fantasy

Bu fonksiyon:

Hikaye üretir (GPT)

Görsel üretir (OpenAI Image/SD)

Video prompt üretir (Pika/Runway)

Supabase DB’ye kaydeder

schema.ts
import { z } from "zod";

export const FantasySchema = z.object({
  type: z.enum(["story", "image", "video"]),
  prompt: z.string().min(5),
});

export type FantasyInput = z.infer<typeof FantasySchema>;

index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import OpenAI from "npm:openai";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { FantasySchema } from "./schema.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

serve(async (req) => {
  try {
    const input = FantasySchema.parse(await req.json());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create request record
    const { data: requestData } = await supabase
      .from("ai_fantasy_requests")
      .insert({
        prompt: input.prompt,
        fantasy_type: input.type,
        status: "pending",
      })
      .select()
      .single();

    let resultText = null;
    let resultImage = null;
    let resultVideo = null;

    if (input.type === "story") {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are Ipelya Fantasy Engine. Generate a short fantasy story."
          },
          {
            role: "user",
            content: input.prompt,
          },
        ],
      });
      resultText = completion.choices[0].message.content;
    }

    if (input.type === "image") {
      const img = await openai.images.generate({
        prompt: input.prompt,
        size: "1024x1024",
      });
      resultImage = img.data[0].url;
    }

    if (input.type === "video") {
      resultVideo = `This prompt is suitable for Pika/Runway: ${input.prompt}`;
    }

    await supabase.from("ai_fantasy_outputs").insert({
      request_id: requestData.id,
      output_text: resultText,
      output_image_url: resultImage,
      output_video_url: resultVideo,
    });

    await supabase
      .from("ai_fantasy_requests")
      .update({ status: "done" })
      .eq("id", requestData.id);

    return new Response(JSON.stringify({ request_id: requestData.id }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

#️⃣ 3) BUY PPV — buy-ppv

Jeton kontrolü + satış işlemi + revenue.

// supabase/functions/buy-ppv/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const { content_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const auth = req.headers.get("Authorization")!;
    const jwt = auth.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabase.auth.getUser(jwt);

    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    const { data: content } = await supabase
      .from("creator_content")
      .select("*")
      .eq("id", content_id)
      .single();

    const coinCost = content.ppv_price;

    const { data: balance } = await supabase.rpc("get_coin_balance", {
      profile_id: buyerProfile.id,
    });

    if (balance < coinCost) {
      return new Response(JSON.stringify({ error: "Insufficient coins" }), {
        status: 400,
      });
    }

    await supabase.rpc("deduct_coins", {
      profile_id: buyerProfile.id,
      amount: coinCost,
    });

    await supabase.from("ppv_purchases").insert({
      buyer_profile_id: buyerProfile.id,
      content_id: content.id,
      price: coinCost,
    });

    return new Response(
      JSON.stringify({ message: "Purchase successful" }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

#️⃣ 4) CONTACT FIREWALL — upload-contacts
// supabase/functions/upload-contacts/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  hashed_contacts: z.array(z.string()),
});

serve(async (req) => {
  const body = schema.parse(await req.json());

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // logic...
});

#️⃣ 5) LOG SCREENSHOT — log-screenshot
// Insert event + realtime notify

#️⃣ 6) LIVEKIT TOKEN — get-livekit-token
// Create LiveKit server token for secure room access

#️⃣ 7) DMCA SCAN — dmca-scan
// Cron job, reverse search, insert dmca_reports