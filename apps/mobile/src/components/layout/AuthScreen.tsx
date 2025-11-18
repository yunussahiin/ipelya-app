import { ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthScreen({ title, subtitle, footer, children }: AuthScreenProps) {
  const { width, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const isSmallPhone = width < 375;
  const isPhone = width < 768;
  const horizontalPadding = isPhone ? LAYOUT_CONSTANTS.screenPaddingHorizontal : 32;
  const topPadding = isSmallPhone ? 16 : 24;
  const bottomPadding = isSmallPhone ? 24 : 32;

  const dynamicStyles = createStyles(horizontalPadding, topPadding, bottomPadding, insets, colors);

  return (
    <SafeAreaView
      style={[dynamicStyles.safe, { backgroundColor: colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <LinearGradient colors={["#050505", "#050505", "#050505"]} style={dynamicStyles.gradient}>
        <ScrollView
          contentContainerStyle={[dynamicStyles.content, { minHeight: windowHeight }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.brand}>ipelya</Text>
            <Text style={dynamicStyles.title}>{title}</Text>
            {subtitle ? <Text style={dynamicStyles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={dynamicStyles.card}>{children}</View>
          {footer ? <View style={dynamicStyles.footer}>{footer}</View> : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function createStyles(
  horizontalPadding: number,
  topPadding: number,
  bottomPadding: number,
  insets: any,
  colors: any
) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background
    },
    gradient: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topPadding + insets.top,
      paddingBottom: bottomPadding + insets.bottom
    },
    content: {
      gap: LAYOUT_CONSTANTS.sectionGap,
      flexGrow: 1
    },
    header: {
      gap: 8
    },
    brand: {
      color: colors.accentSoft,
      fontSize: 16,
      letterSpacing: 4,
      textTransform: "uppercase",
      fontWeight: "600"
    },
    title: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: LAYOUT_CONSTANTS.radiusXXL,
      padding: horizontalPadding,
      gap: LAYOUT_CONSTANTS.inputGap,
      borderWidth: 1,
      borderColor: colors.border
    },
    footer: {
      alignItems: "center",
      gap: 8,
      paddingTop: LAYOUT_CONSTANTS.sectionGap
    }
  });
}
