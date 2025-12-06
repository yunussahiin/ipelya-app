import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/theme/ThemeProvider";
import { AvatarSkeleton, TextSkeleton } from "@/components/ui";
import { logger } from "@/utils/logger";

export default function EntryScreen() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const markHydrated = useAuthStore((state) => state.markHydrated);

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        // Hata varsa veya session yoksa, storage'ı temizle
        if (error || !data.session) {
          await supabase.auth.signOut();
          if (isMounted) {
            markHydrated();
          }
          return;
        }

        if (data.session?.access_token && isMounted) {
          setSession(data.session.access_token);
        }
      } catch (err) {
        logger.error("Session hydration error", err, { tag: "Auth" });
        await supabase.auth.signOut();
      } finally {
        if (isMounted) {
          markHydrated();
        }
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [markHydrated, setSession]);

  const { colors } = useTheme();

  if (!isHydrated) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <AvatarSkeleton size={64} />
        <TextSkeleton width={180} height={16} />
        <Text style={[styles.loaderLabel, { color: colors.textMuted }]}>
          Oturum geri yükleniyor...
        </Text>
      </View>
    );
  }

  if (sessionToken) {
    return <Redirect href="/(feed)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  loaderLabel: {
    fontWeight: "600",
    marginTop: 8
  }
});
