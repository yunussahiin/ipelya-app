import { useEffect, useState } from "react";
import { PageScreen } from "@/components/layout/PageScreen";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabaseClient";
import { useOpsRealtime } from "@/hooks/useOpsRealtime";
import { useShadowStore } from "@/store/shadow.store";
import { useTheme } from "@/theme/ThemeProvider";
import { ShadowToggle } from "@/components/ShadowToggle";

export const options = {
  title: "Shadow Feed",
  headerShown: true
};

export default function ShadowFeedScreen() {
  const { colors } = useTheme();
  const [shadowProfile, setShadowProfile] = useState<Record<string, unknown> | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [userId, setUserId] = useState<string | undefined>();
  const shadowEnabled = useShadowStore((state) => state.enabled);
  const sessionId = useShadowStore((state) => state.sessionId);

  // Initialize realtime listener only when shadow mode is active
  useOpsRealtime(shadowEnabled ? userId : undefined);

  // Get current user and shadow profile
  useEffect(() => {
    const setupUser = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (user?.id) {
          console.log("🔗 Current user ID:", user.id);
          setUserId(user.id);
          setDebugInfo(
            `User ID: ${user.id}\nShadow Enabled: ${shadowEnabled}\nSession ID: ${sessionId}`
          );

          // Fetch shadow profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "shadow")
            .single();

          if (profile) {
            console.log("🎭 Shadow profile loaded:", profile);
            setShadowProfile(profile);
          }
        }
      } catch (error) {
        console.error("❌ Error loading user:", error);
      }
    };

    setupUser();
  }, []);

  return (
    <PageScreen>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🎭 Shadow Profil</Text>
        <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
          Gizli profil bilgileri ve realtime durumu
        </Text>
      </View>

      {shadowProfile && (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Profil Bilgisi</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Ad:</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {(shadowProfile?.display_name as string) || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Kullanıcı Adı:</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {(shadowProfile?.username as string) || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Tip:</Text>
            <Text style={[styles.value, { color: colors.accent }]}>
              {(shadowProfile?.type as string) === "shadow" ? "🎭 Shadow" : "👤 Real"}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Shadow Mode Durumu</Text>
        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: shadowEnabled ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"
            }
          ]}
        >
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {shadowEnabled ? "🎭 Shadow Mode: AKTIF" : "👤 Shadow Mode: PASIF"}
          </Text>
          <Text
            style={[styles.statusText, { color: colors.textMuted, fontSize: 12, marginTop: 8 }]}
          >
            {shadowEnabled
              ? "Shadow profil ile işlem yapıyorsunuz"
              : "Gerçek profil ile işlem yapıyorsunuz"}
          </Text>
          {sessionId && (
            <Text
              style={[styles.statusText, { color: colors.textMuted, fontSize: 11, marginTop: 8 }]}
            >
              📍 Oturum ID: {sessionId.substring(0, 8)}...
            </Text>
          )}
        </View>
      </View>

      <ShadowToggle onToggleComplete={() => console.log("Shadow mode toggled")} />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Realtime Durumu</Text>
        <View style={styles.statusBox}>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            ✅ Realtime listener aktif
          </Text>
          <Text
            style={[styles.statusText, { color: colors.textMuted, fontSize: 12, marginTop: 8 }]}
          >
            Web-ops'tan gelen komutları dinliyor...
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Test Bilgisi</Text>
        <Text style={[styles.testText, { color: colors.textMuted }]}>
          Bu ekran Web-Ops to Mobile realtime senkronizasyonunu test etmek için kullanılmaktadır.
        </Text>
        <Text style={[styles.testText, { color: colors.textMuted, marginTop: 8 }]}>
          Console log'larını izleyerek broadcast event'lerini görebilirsiniz.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🔧 Debug Info</Text>
        <Text style={[styles.testText, { color: colors.textMuted, fontFamily: "monospace" }]}>
          {debugInfo || "Yükleniyor..."}
        </Text>
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4
  },
  sectionDescription: {
    fontSize: 14
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8
  },
  label: {
    fontSize: 14,
    fontWeight: "500"
  },
  value: {
    fontSize: 14,
    fontWeight: "600"
  },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(34, 197, 94, 0.1)"
  },
  statusText: {
    fontSize: 13,
    lineHeight: 20
  },
  testText: {
    fontSize: 13,
    lineHeight: 20
  }
});
