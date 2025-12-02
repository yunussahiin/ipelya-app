/**
 * BroadcastLinkPreview
 *
 * Amaç: Mesajdaki URL'lerin önizlemesini gösterir
 * Tarih: 2025-12-02
 *
 * Özellikler:
 * - URL detection (regex)
 * - Open Graph meta data fetch
 * - Önizleme kartı (resim, başlık, açıklama)
 * - Tıklayınca tarayıcıda aç
 */

import { useState, useEffect, memo } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { ExternalLink, Globe } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

interface BroadcastLinkPreviewProps {
  content: string;
}

// URL'leri bul
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

// Link metadata fetch (basit implementation)
async function fetchLinkMetadata(url: string): Promise<LinkMetadata | null> {
  try {
    // Basit bir proxy veya direkt fetch
    // Production'da bir edge function kullanılabilir
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)"
      }
    });

    if (!response.ok) return { url };

    const html = await response.text();

    // Open Graph meta tags parse
    const getMetaContent = (property: string): string | undefined => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`,
        "i"
      );
      const altRegex = new RegExp(
        `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`,
        "i"
      );
      const match = html.match(regex) || html.match(altRegex);
      return match?.[1];
    };

    // Title
    const ogTitle = getMetaContent("og:title");
    const twitterTitle = getMetaContent("twitter:title");
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = ogTitle || twitterTitle || titleMatch?.[1];

    // Description
    const ogDesc = getMetaContent("og:description");
    const twitterDesc = getMetaContent("twitter:description");
    const metaDesc = getMetaContent("description");
    const description = ogDesc || twitterDesc || metaDesc;

    // Image
    const ogImage = getMetaContent("og:image");
    const twitterImage = getMetaContent("twitter:image");
    const image = ogImage || twitterImage;

    // Site name
    const siteName = getMetaContent("og:site_name");

    // Favicon
    const faviconMatch = html.match(
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i
    );
    let favicon = faviconMatch?.[1];
    if (favicon && !favicon.startsWith("http")) {
      const urlObj = new URL(url);
      favicon = favicon.startsWith("/")
        ? `${urlObj.origin}${favicon}`
        : `${urlObj.origin}/${favicon}`;
    }

    return {
      url,
      title: title?.trim(),
      description: description?.trim()?.slice(0, 150),
      image,
      siteName,
      favicon
    };
  } catch (error) {
    console.log("Link preview fetch error:", error);
    return { url };
  }
}

export const BroadcastLinkPreview = memo(function BroadcastLinkPreview({
  content
}: BroadcastLinkPreviewProps) {
  const { colors } = useTheme();
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const urls = extractUrls(content);
  const firstUrl = urls[0];

  useEffect(() => {
    if (!firstUrl) return;

    let cancelled = false;
    setIsLoading(true);

    fetchLinkMetadata(firstUrl).then((data) => {
      if (!cancelled) {
        setMetadata(data);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [firstUrl]);

  if (!firstUrl || isLoading) return null;
  if (!metadata?.title && !metadata?.image) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(metadata.url);
  };

  // Domain adını al
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: colors.backgroundRaised, borderColor: colors.border }
      ]}
      onPress={handlePress}
    >
      {/* Resim */}
      {metadata.image && (
        <Image source={{ uri: metadata.image }} style={styles.image} contentFit="cover" />
      )}

      {/* İçerik */}
      <View style={styles.content}>
        {/* Site adı */}
        <View style={styles.siteRow}>
          {metadata.favicon ? (
            <Image source={{ uri: metadata.favicon }} style={styles.favicon} />
          ) : (
            <Globe size={12} color={colors.textMuted} />
          )}
          <Text style={[styles.siteName, { color: colors.textMuted }]} numberOfLines={1}>
            {metadata.siteName || getDomain(metadata.url)}
          </Text>
          <ExternalLink size={12} color={colors.textMuted} />
        </View>

        {/* Başlık */}
        {metadata.title && (
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {metadata.title}
          </Text>
        )}

        {/* Açıklama */}
        {metadata.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {metadata.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8
  },
  image: {
    width: "100%",
    height: 120
  },
  content: {
    padding: 12,
    gap: 4
  },
  siteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 2
  },
  siteName: {
    fontSize: 12,
    flex: 1
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18
  },
  description: {
    fontSize: 12,
    lineHeight: 16
  }
});

export default BroadcastLinkPreview;
