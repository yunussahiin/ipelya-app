import { ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PageScreen } from "@/components/layout/PageScreen";

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthScreen({ title, subtitle, footer, children }: AuthScreenProps) {
  return (
    <PageScreen showNavigation={false} contentStyle={() => [styles.page]}> 
      {() => (
        <LinearGradient colors={["#120817", "#1a1023", "#120817"]} style={styles.gradient}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.brand}>ipelya</Text>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.card}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </LinearGradient>
      )}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 0
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40
  },
  content: {
    gap: 24
  },
  header: {
    gap: 8
  },
  brand: {
    color: "#f472b6",
    fontSize: 16,
    letterSpacing: 4,
    textTransform: "uppercase",
    fontWeight: "600"
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700"
  },
  subtitle: {
    color: "#d1d5db",
    fontSize: 16
  },
  card: {
    backgroundColor: "rgba(18, 8, 23, 0.85)",
    borderRadius: 28,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  footer: {
    alignItems: "center",
    gap: 8
  }
});
