import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { supabase } from "@/lib/supabaseClient";

// QueryParams helper
const parseQueryParams = (url: string) => {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return { params, errorCode: params.error || null };
};

// Web browser session'ı tamamla (web-only, mobile'da hata vermez)
WebBrowser.maybeCompleteAuthSession();

/**
 * Deep linking için redirect URL'i oluştur
 * Format: exp://192.168.1.140:8081/callback
 */
export const getRedirectUrl = () => {
  return makeRedirectUri({
    scheme: "exp",
    path: "oauth-callback",
  });
};

/**
 * URL'den session oluştur
 * OAuth provider'dan dönen access_token ve refresh_token'ı al
 * @param url - OAuth callback URL'i (tarayıcıdan dönen URL)
 */
export const createSessionFromUrl = async (url: string) => {
  try {
    const { params, errorCode } = parseQueryParams(url);

    if (errorCode) {
      throw new Error(`OAuth error: ${errorCode}`);
    }

    // Token'sız URL'leri sessizce ignore et (initial URL gibi)
    if (!params.access_token || !params.refresh_token) {
      console.log("ℹ️ Token'sız URL, OAuth callback değil");
      return null;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    if (error) throw error;

    console.log("✅ OAuth session başarıyla oluşturuldu");
    return data.session;
  } catch (error) {
    console.error("❌ OAuth session oluşturma hatası:", error);
    throw error;
  }
};

/**
 * Google ile OAuth giriş yap
 * Tarayıcıda Google login sayfasını aç ve callback'i yakala
 */
export const signInWithGoogle = async () => {
  try {
    const redirectUrl = getRedirectUrl();

    console.log("🔵 Google OAuth başlatılıyor...");
    console.log("Redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Tarayıcıyı manuel aç
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("OAuth URL alınamadı");

    console.log("🌐 Tarayıcı açılıyor...");

    // Tarayıcıda Google login sayfasını aç
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type === "success") {
      console.log("✅ Tarayıcıdan başarıyla geri döndü");
      const session = await createSessionFromUrl(result.url);
      return session;
    } else if (result.type === "cancel") {
      console.log("⚠️ Kullanıcı OAuth'u iptal etti");
      throw new Error("OAuth iptal edildi");
    } else if (result.type === "dismiss") {
      console.log("⚠️ Tarayıcı kapatıldı");
      throw new Error("Tarayıcı kapatıldı");
    }
  } catch (error) {
    console.error("❌ Google OAuth hatası:", error);
    throw error;
  }
};

/**
 * Deep linking URL'sini dinle ve session oluştur
 * App.tsx'de useEffect içinde çağrılmalı
 */
export const setupDeepLinkListener = () => {
  const url = Linking.useURL();

  if (url != null) {
    console.log("🔗 Deep link alındı:", url);
    createSessionFromUrl(url).catch((error) => {
      console.error("Deep link session oluşturma hatası:", error);
    });
  }
};

/**
 * Magic link (email) ile giriş yap
 * Kullanıcının email'ine giriş linki gönder
 */
export const signInWithMagicLink = async (email: string) => {
  try {
    const redirectUrl = getRedirectUrl();

    console.log("📧 Magic link gönderiliyor:", email);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;

    console.log("✅ Magic link email'e gönderildi");
    return true;
  } catch (error) {
    console.error("❌ Magic link hatası:", error);
    throw error;
  }
};

/**
 * Apple ile OAuth giriş yap (iOS only)
 * Apple Sign-In flow'u başlat
 */
export const signInWithApple = async () => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In sadece iOS'ta kullanılabilir");
  }

  try {
    console.log("🍎 Apple Sign-In başlatılıyor...");

    // Apple Sign-In request'i yap
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    // Credential state'i kontrol et
    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user
    );

    if (
      credentialState === appleAuth.State.AUTHORIZED &&
      appleAuthRequestResponse.identityToken &&
      appleAuthRequestResponse.authorizationCode
    ) {
      console.log("✅ Apple Sign-In başarılı");

      // Supabase'e Apple token'ını gönder
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: appleAuthRequestResponse.identityToken,
        nonce: appleAuthRequestResponse.nonce,
        access_token: appleAuthRequestResponse.authorizationCode,
      });

      if (error) throw error;

      console.log("✅ Apple OAuth session oluşturuldu");
      return data.session;
    } else {
      throw new Error("Apple Sign-In başarısız oldu");
    }
  } catch (error) {
    console.error("❌ Apple Sign-In hatası:", error);
    throw error;
  }
};
