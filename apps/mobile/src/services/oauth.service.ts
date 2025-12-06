import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

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
      return null;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    if (error) throw error;

    logger.debug("OAuth session created", { tag: "OAuth" });
    return data.session;
  } catch (error) {
    logger.error("OAuth session creation error", error, { tag: "OAuth" });
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

    logger.debug("Google OAuth starting", { tag: "OAuth" });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Tarayıcıyı manuel aç
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("OAuth URL alınamadı");

    // Tarayıcıda Google login sayfasını aç
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type === "success") {
      const session = await createSessionFromUrl(result.url);
      return session;
    } else if (result.type === "cancel") {
      throw new Error("OAuth iptal edildi");
    } else if (result.type === "dismiss") {
      throw new Error("Tarayıcı kapatıldı");
    }
  } catch (error) {
    logger.error("Google OAuth error", error, { tag: "OAuth" });
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
    createSessionFromUrl(url).catch((error) => {
      logger.error("Deep link session error", error, { tag: "OAuth" });
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

    logger.debug(`Magic link sending to: ${email}`, { tag: "OAuth" });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;

    logger.debug("Magic link sent", { tag: "OAuth" });
    return true;
  } catch (error) {
    logger.error("Magic link error", error, { tag: "OAuth" });
    throw error;
  }
};

/**
 * Apple ile OAuth giriş yap (iOS only)
 * expo-apple-authentication kullanarak Apple Sign-In flow'u başlat
 */
export const signInWithApple = async () => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In sadece iOS'ta kullanılabilir");
  }

  try {
    logger.debug("Apple Sign-In starting", { tag: "OAuth" });

    // Nonce oluştur (güvenlik için)
    const rawNonce = Math.random().toString(36).substring(2, 15);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    // Apple Sign-In request'i yap
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (credential.identityToken) {

      // Supabase'e Apple token'ını gönder
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce, // Raw nonce gönder, Supabase hash'leyecek
      });

      if (error) throw error;

      logger.debug("Apple OAuth session created", { tag: "OAuth" });
      return data.session;
    } else {
      throw new Error("Apple Sign-In: Identity token alınamadı");
    }
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ERR_REQUEST_CANCELED"
    ) {
      throw new Error("Apple Sign-In iptal edildi");
    }
    logger.error("Apple Sign-In error", error, { tag: "OAuth" });
    throw error;
  }
};
