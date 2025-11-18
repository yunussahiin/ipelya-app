import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/auth.store";

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
        console.error("Session hydration error:", err);
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

  if (!isHydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f472b6" />
        <Text style={styles.loaderLabel}>Oturum geri yükleniyor...</Text>
      </View>
    );
  }

  if (sessionToken) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050308",
    gap: 12
  },
  loaderLabel: {
    color: "#94a3b8",
    fontWeight: "600"
  }
});
