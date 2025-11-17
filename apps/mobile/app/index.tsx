import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const socialButtons = [
  { key: "apple", label: "Apple ile devam et", icon: "logo-apple" as const },
  { key: "google", label: "Google ile devam et", icon: "logo-google" as const }
];

const heroImage = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=80&cs=tinysrgb";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <PageScreen
      showNavigation={false}
      contentStyle={() => [
        styles.page,
        {
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          gap: 0
        }
      ]}
    >
      {({ layout }) => {
        const topInset = layout.insets.top + 36;
        const bottomInset = layout.insets.bottom + 30;
        const horizontal = Math.max(layout.contentPaddingHorizontal, 28);

        return (
          <View style={styles.fill}>
            <LinearGradient
              colors={["#fdf6ff", "#fde1f1", "#f0b2ce"]}
              locations={[0, 0.55, 1]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View pointerEvents="none" style={styles.shapeLayer}>
              <View style={[styles.shape, styles.shapeTop]} />
              <View style={[styles.shape, styles.shapeMid]} />
              <View style={[styles.shape, styles.shapeBottom]} />
            </View>
            <View
              style={[
                styles.content,
                {
                  paddingTop: topInset,
                  paddingBottom: bottomInset,
                  paddingHorizontal: horizontal
                }
              ]}
            >
              <View style={styles.hero}>
                <Text style={styles.brand}>ipelya</Text>
                <View style={styles.heroImageWrap}>
                  <Image source={{ uri: heroImage }} style={styles.heroImage} />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.4)"]}
                    style={styles.heroOverlay}
                    start={{ x: 0.5, y: 0.2 }}
                    end={{ x: 0.5, y: 1 }}
                  />
                  <View style={styles.heroBadge}>
                    <Ionicons name="heart" color="#ff6aa0" size={14} />
                    <Text style={styles.heroBadgeText}>40M+ eşleşme</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>Hoş geldin</Text>
                <Text style={styles.heroSubtitle}>Kendin ol, doğru bağlantılar seni bulsun.</Text>
              </View>
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Hemen giriş yap</Text>
                  <Text style={styles.formSubtitle}>Hesabına e-posta ve şifrenle ulaş</Text>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>E-posta</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="mail-outline" size={18} color="#7a6d76" />
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="ornek@ipelya.com"
                      placeholderTextColor="rgba(0,0,0,0.4)"
                      style={styles.input}
                      value={form.email}
                      onChangeText={(email) => setForm((prev) => ({ ...prev, email }))}
                    />
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <View style={styles.passwordRow}>
                    <Text style={styles.inputLabel}>Şifre</Text>
                    <Pressable>
                      <Text style={styles.forgot}>Şifremi unuttum</Text>
                    </Pressable>
                  </View>
                  <View style={styles.inputShell}>
                    <Ionicons name="lock-closed-outline" size={18} color="#7a6d76" />
                    <TextInput
                      secureTextEntry
                      placeholder="••••••••"
                      placeholderTextColor="rgba(0,0,0,0.4)"
                      style={styles.input}
                      value={form.password}
                      onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
                    />
                    <Ionicons name="eye-outline" size={18} color="#7a6d76" />
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedState]}
                    onPress={() => router.replace("/home")}
                  >
                    <Text style={styles.primaryLabel}>Giriş yap</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedState]}>
                    <Text style={styles.secondaryLabel}>Hesap oluştur</Text>
                  </Pressable>
                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerLabel}>veya</Text>
                    <View style={styles.divider} />
                  </View>
                  {socialButtons.map((button) => (
                    <Pressable
                      key={button.key}
                      style={({ pressed }) => [styles.socialButton, pressed && styles.pressedState]}
                    >
                      <Text style={styles.socialLabel}>{button.label}</Text>
                      <View style={styles.socialIcon}>
                        <Ionicons name={button.icon} size={18} color="#ffffff" />
                      </View>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.terms}>
                  Devam ederek İpelya&apos;nın <Text style={styles.termsLink}>Kullanım Şartları</Text> ve{" "}
                  <Text style={styles.termsLink}>Gizlilik Politikası</Text>&apos;nı kabul edersin.
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    page: {
      flexGrow: 1
    },
    fill: {
      flex: 1
    },
    shapeLayer: {
      ...StyleSheet.absoluteFillObject
    },
    shape: {
      position: "absolute",
      borderRadius: 260,
      opacity: 0.4
    },
    shapeTop: {
      width: 330,
      height: 260,
      top: -60,
      right: -50,
      backgroundColor: "rgba(255, 214, 255, 0.9)"
    },
    shapeMid: {
      width: 380,
      height: 300,
      top: 120,
      left: -80,
      backgroundColor: "rgba(255, 130, 109, 0.55)",
      transform: [{ rotate: "-12deg" }]
    },
    shapeBottom: {
      width: 520,
      height: 360,
      bottom: -200,
      right: -60,
      backgroundColor: "rgba(255, 140, 0, 0.45)"
    },
    content: {
      flex: 1,
      gap: 28
    },
    hero: {
      alignItems: "center",
      gap: 14
    },
    brand: {
      fontSize: 18,
      letterSpacing: 6,
      textTransform: "uppercase",
      color: "#cc558b",
      fontWeight: "700"
    },
    heroImageWrap: {
      width: "100%",
      borderRadius: 32,
      overflow: "hidden",
      position: "relative",
      aspectRatio: 1.2,
      backgroundColor: "#d0c3ff"
    },
    heroImage: {
      width: "100%",
      height: "100%"
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject
    },
    heroBadge: {
      position: "absolute",
      top: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "#fff"
    },
    heroBadgeText: {
      color: "#6d1d3c",
      fontWeight: "600"
    },
    heroTitle: {
      fontSize: 30,
      color: "#2f1224",
      fontWeight: "700"
    },
    heroSubtitle: {
      color: "#5a3f4f",
      fontSize: 15,
      textAlign: "center"
    },
    formCard: {
      borderRadius: 40,
      padding: 28,
      backgroundColor: "rgba(255,255,255,0.9)",
      shadowColor: "#d57daa",
      shadowOpacity: 0.25,
      shadowRadius: 40
    },
    formHeader: {
      gap: 6,
      marginBottom: 18
    },
    formTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#2a1121"
    },
    formSubtitle: {
      color: "#6f4e5f",
      fontSize: 14
    },
    fieldGroup: {
      marginBottom: 18
    },
    inputLabel: {
      color: "#321628",
      fontWeight: "600",
      marginBottom: 8
    },
    inputShell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      borderRadius: 18,
      backgroundColor: "rgba(50,22,40,0.05)",
      borderWidth: 1,
      borderColor: "rgba(50,22,40,0.08)"
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
      color: "#1d0a16"
    },
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    forgot: {
      color: "#c24578",
      fontWeight: "600",
      fontSize: 12
    },
    actions: {
      gap: 14
    },
    primaryButton: {
      borderRadius: 999,
      backgroundColor: "#22121f",
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#22121f",
      shadowOpacity: 0.25,
      shadowRadius: 20
    },
    primaryLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: "#ffffff"
    },
    secondaryButton: {
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "rgba(0,0,0,0.2)",
      backgroundColor: "transparent"
    },
    secondaryLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: "#201020"
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    divider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.4)"
    },
    dividerLabel: {
      fontSize: 11,
      letterSpacing: 1.1,
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase"
    },
    socialButton: {
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.4)",
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)"
    },
    socialLabel: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "600"
    },
    socialIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center"
    },
    terms: {
      fontSize: 12,
      color: "rgba(255,255,255,0.82)",
      textAlign: "center",
      lineHeight: 18
    },
    termsLink: {
      color: colors.accent,
      fontWeight: "600"
    },
    pressedState: {
      opacity: 0.85
    }
  });
};
