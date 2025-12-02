import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase environment değişkenleri eksik, client sınırlı çalışacak.");
}

export const supabase = createClient(supabaseUrl, supabaseKey ?? "", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

/**
 * AppState listener - Uygulamanın ön/arka plana gelmesini dinle
 * Token yenilemeyi uygun şekilde yönet (pil tasarrufu)
 */
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      // Uygulama ön plana geldi - token yenilemeyi başlat
      supabase.auth.startAutoRefresh();
    } else {
      // Uygulama arka plana gitti - token yenilemeyi durdur
      supabase.auth.stopAutoRefresh();
    }
  });
}
