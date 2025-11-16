import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const socialButtons = [
  { key: "apple", label: "Apple ile devam et", icon: "logo-apple" as const },
  { key: "google", label: "Google ile devam et", icon: "logo-google" as const }
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen
      showNavigation={false}
      scrollViewProps={{ scrollEnabled: false }}
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
              colors={["#ffd9ff", "#ff8fa3", "#812231"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.8, y: 1 }}
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
              <View style={styles.copy}>
                <Text style={styles.script}>Haydi</Text>
                <Text style={styles.headline}>
                  <Text style={styles.accent}>seni</Text> gerçekten anlayan{"\n"}biriyle tanıştıralım.
                </Text>
                <Text style={styles.body}>
                  Ortak değerler, ilgi alanları ve hedefler üzerine kurulu gerçek bağlar keşfet. İlk adım sadece bir dokunuş
                  uzağında.
                </Text>
              </View>
              <View style={styles.footer}>
                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedState]}
                    onPress={() => router.replace("/home")}
                  >
                    <Text style={styles.primaryLabel}>E-posta ile devam et</Text>
                  </Pressable>
                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerLabel}>ya da şununla devam et</Text>
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
      opacity: 0.45
    },
    shapeTop: {
      width: 330,
      height: 260,
      top: -60,
      right: -50,
      backgroundColor: "rgba(255, 214, 255, 0.8)"
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
      justifyContent: "space-between",
      gap: 24
    },
    copy: {
      alignItems: "center",
      gap: 12
    },
    script: {
      color: "#ffe9ff",
      fontSize: 30,
      fontStyle: "italic"
    },
    headline: {
      fontSize: 34,
      lineHeight: 42,
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "500"
    },
    accent: {
      color: "#ff9f3f",
      fontStyle: "italic"
    },
    body: {
      textAlign: "center",
      color: "rgba(255,255,255,0.88)",
      fontSize: 15,
      lineHeight: 22
    },
    footer: {
      gap: 18
    },
    actions: {
      gap: 16
    },
    primaryButton: {
      borderRadius: 999,
      backgroundColor: "#ffffff",
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: "#050505"
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
