import { ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageScreen } from "@/components/layout/PageScreen";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthScreen({ title, subtitle, footer, children }: AuthScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive padding
  const isSmallPhone = width < 375;
  const isPhone = width < 768;
  const horizontalPadding = isPhone ? LAYOUT_CONSTANTS.screenPaddingHorizontal : 32;
  const topPadding = isSmallPhone ? 16 : 24;
  const bottomPadding = isSmallPhone ? 24 : 32;

  const dynamicStyles = createStyles(horizontalPadding, topPadding, bottomPadding, insets);

  return (
    <PageScreen showNavigation={false} contentStyle={() => [dynamicStyles.page]}>
      {() => (
        <LinearGradient colors={["#120817", "#1a1023", "#120817"]} style={dynamicStyles.gradient}>
          <ScrollView
            contentContainerStyle={dynamicStyles.content}
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
      )}
    </PageScreen>
  );
}

function createStyles(
  horizontalPadding: number,
  topPadding: number,
  bottomPadding: number,
  insets: any
) {
  return StyleSheet.create({
    page: {
      flex: 1,
      padding: 0
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
      color: "#f472b6",
      fontSize: 16,
      letterSpacing: 4,
      textTransform: "uppercase",
      fontWeight: "600"
    },
    title: {
      color: "#fff",
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40
    },
    subtitle: {
      color: "#d1d5db",
      fontSize: 16,
      lineHeight: 24
    },
    card: {
      backgroundColor: "rgba(18, 8, 23, 0.85)",
      borderRadius: LAYOUT_CONSTANTS.radiusXXL,
      padding: horizontalPadding,
      gap: LAYOUT_CONSTANTS.inputGap,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)"
    },
    footer: {
      alignItems: "center",
      gap: 8,
      paddingTop: LAYOUT_CONSTANTS.sectionGap
    }
  });
}
