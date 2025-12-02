/**
 * Toast Provider & Context
 *
 * Amaç: Uygulama genelinde kullanılabilecek toast/sonner tarzı bildirim sistemi
 * Tarih: 2025-12-02
 *
 * Kullanım:
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Başarılı!' });
 */

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, X, AlertCircle, Info } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// =============================================
// TYPES
// =============================================

type ToastType = "success" | "error" | "warning" | "info";

interface ToastConfig {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number; // ms, default 3000
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

// =============================================
// CONTEXT
// =============================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// =============================================
// PROVIDER
// =============================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setVisible(false);
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (config: ToastConfig) => {
      // Önceki timeout'u temizle
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Haptic feedback
      if (config.type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (config.type === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setToast(config);
      setVisible(true);

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();

      // Auto hide
      const duration = config.duration || 3000;
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast]
  );

  const getIcon = (type: ToastType) => {
    const iconProps = { size: 20, strokeWidth: 2.5 };
    switch (type) {
      case "success":
        return <Check {...iconProps} color={colors.accent} />;
      case "error":
        return <X {...iconProps} color={colors.accent} />;
      case "warning":
        return <AlertCircle {...iconProps} color={colors.accent} />;
      case "info":
        return <Info {...iconProps} color={colors.accent} />;
    }
  };

  const getBackgroundColor = (type: ToastType) => {
    // Tema uyumlu arka plan
    return colors.surface;
  };

  const getBorderColor = (type: ToastType) => {
    // Tema uyumlu border
    return colors.border;
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {visible && toast && (
        <Animated.View
          style={[
            styles.container,
            {
              bottom: insets.bottom + 16,
              transform: [{ translateY }],
              opacity
            }
          ]}
        >
          <Pressable
            style={[
              styles.toast,
              {
                backgroundColor: getBackgroundColor(toast.type),
                borderColor: getBorderColor(toast.type)
              }
            ]}
            onPress={hideToast}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>{getIcon(toast.type)}</View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.message, { color: colors.textPrimary }]}>{toast.message}</Text>
              {toast.description && (
                <Text style={[styles.description, { color: colors.textMuted }]}>
                  {toast.description}
                </Text>
              )}
            </View>

            {/* Action button */}
            {toast.action && (
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  toast.action?.onPress();
                  hideToast();
                }}
              >
                <Text style={[styles.actionText, { color: colors.accent }]}>
                  {toast.action.label}
                </Text>
              </Pressable>
            )}

            {/* Close button */}
            <Pressable style={styles.closeButton} onPress={hideToast}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12
  },
  iconContainer: {
    marginRight: 12
  },
  content: {
    flex: 1
  },
  message: {
    fontSize: 14,
    fontWeight: "600"
  },
  description: {
    fontSize: 13,
    marginTop: 2
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600"
  },
  closeButton: {
    marginLeft: 8,
    padding: 4
  }
});

export default ToastProvider;
