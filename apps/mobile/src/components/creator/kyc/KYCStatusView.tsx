/**
 * KYCStatusView Component
 * KYC durumlarının görsel sunumu - Gelişmiş UI/UX
 */

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import {
  Shield,
  ShieldCheck,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Wallet,
  Timer
} from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type KYCStatus = "none" | "pending" | "approved" | "rejected";

export interface KYCProfile {
  status: KYCStatus;
  level?: "basic" | "full" | null;
  verifiedName?: string | null;
  monthlyPayoutLimit?: number | null;
  verifiedAt?: string | null;
  pendingApplication?: {
    id: string;
    level: "basic" | "full";
    submittedAt: string;
  } | null;
  lastRejection?: {
    reason: string;
    rejectedAt: string;
  } | null;
  // Yeni: Mobile için ayarlar
  canApply?: boolean;
  limits?: {
    basic: number;
    full: number;
  };
  cooldown?: {
    enabled: boolean;
    days: number;
    until: string | null;
  };
}

interface KYCStatusViewProps {
  profile: KYCProfile | null;
  hasProgress?: boolean;
  onStart: () => void;
  onReset?: () => void;
}

// ─────────────────────────────────────────────────────────
// Status Configurations
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  none: {
    gradient: ["#6366F1", "#8B5CF6"],
    iconBg: "#6366F120",
    iconColor: "#6366F1"
  },
  pending: {
    gradient: ["#F59E0B", "#D97706"],
    iconBg: "#F59E0B15",
    iconColor: "#F59E0B"
  },
  approved: {
    gradient: ["#10B981", "#059669"],
    iconBg: "#10B98115",
    iconColor: "#10B981"
  },
  rejected: {
    gradient: ["#EF4444", "#DC2626"],
    iconBg: "#EF444415",
    iconColor: "#EF4444"
  }
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function KYCStatusView({ profile, hasProgress, onStart, onReset }: KYCStatusViewProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Animasyonlar
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const status = profile?.status || "none";

  // Status'a göre içerik render et
  switch (status) {
    case "approved":
      return (
        <ApprovedView
          profile={profile!}
          styles={styles}
          colors={colors}
          scaleAnim={scaleAnim}
          fadeAnim={fadeAnim}
        />
      );
    case "pending":
      return (
        <PendingView
          profile={profile!}
          styles={styles}
          colors={colors}
          scaleAnim={scaleAnim}
          fadeAnim={fadeAnim}
        />
      );
    case "rejected":
      return (
        <RejectedView
          profile={profile!}
          styles={styles}
          colors={colors}
          scaleAnim={scaleAnim}
          fadeAnim={fadeAnim}
          onStart={onStart}
        />
      );
    default:
      return (
        <StartView
          styles={styles}
          colors={colors}
          hasProgress={hasProgress}
          onStart={onStart}
          onReset={onReset}
          scaleAnim={scaleAnim}
          fadeAnim={fadeAnim}
        />
      );
  }
}

// ─────────────────────────────────────────────────────────
// Approved View
// ─────────────────────────────────────────────────────────

function ApprovedView({
  profile,
  styles,
  colors,
  scaleAnim,
  fadeAnim
}: {
  profile: KYCProfile;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
}) {
  const config = STATUS_CONFIG.approved;

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <Animated.View
        style={[
          styles.iconWrapper,
          { backgroundColor: config.iconBg, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={[styles.iconInner, { backgroundColor: config.iconColor }]}>
          <ShieldCheck size={40} color="#fff" strokeWidth={2} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: config.iconColor }]}>Hesabınız Doğrulandı</Text>

        <View style={[styles.levelBadge, { backgroundColor: config.iconBg }]}>
          <CheckCircle size={14} color={config.iconColor} />
          <Text style={[styles.levelText, { color: config.iconColor }]}>
            {profile.level === "basic" ? "Temel Doğrulama" : "Tam Doğrulama"}
          </Text>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Kimlik doğrulamanız tamamlandı. Artık kazancınızı çekebilirsiniz.
        </Text>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          {profile.verifiedName && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.infoIconBox, { backgroundColor: config.iconBg }]}>
                <User size={16} color={config.iconColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Doğrulanan İsim</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {profile.verifiedName}
                </Text>
              </View>
            </View>
          )}

          {profile.level === "basic" && profile.monthlyPayoutLimit && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.infoIconBox, { backgroundColor: config.iconBg }]}>
                <Wallet size={16} color={config.iconColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Aylık Çekim Limiti
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  ₺{profile.monthlyPayoutLimit.toLocaleString("tr-TR")}
                </Text>
              </View>
            </View>
          )}

          {profile.verifiedAt && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.infoIconBox, { backgroundColor: config.iconBg }]}>
                <Calendar size={16} color={config.iconColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Doğrulama Tarihi
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {new Date(profile.verifiedAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Upgrade hint for basic */}
        {profile.level === "basic" && (
          <View
            style={[styles.hintBox, { backgroundColor: "#6366F110", borderColor: "#6366F130" }]}
          >
            <Info size={16} color="#6366F1" />
            <Text style={[styles.hintText, { color: "#6366F1" }]}>
              Tam doğrulama ile limitsiz çekim yapabilirsiniz.
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Pending View
// ─────────────────────────────────────────────────────────

function PendingView({
  profile,
  styles,
  colors,
  scaleAnim,
  fadeAnim
}: {
  profile: KYCProfile;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
}) {
  const config = STATUS_CONFIG.pending;

  // Pulse animation for clock
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Pending Icon with pulse */}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: config.iconBg,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }]
          }
        ]}
      >
        <View style={[styles.iconInner, { backgroundColor: config.iconColor }]}>
          <Clock size={40} color="#fff" strokeWidth={2} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: config.iconColor }]}>Başvurunuz İnceleniyor</Text>

        <View style={[styles.levelBadge, { backgroundColor: config.iconBg }]}>
          <Clock size={14} color={config.iconColor} />
          <Text style={[styles.levelText, { color: config.iconColor }]}>
            {profile.pendingApplication?.level === "basic" ? "Temel Doğrulama" : "Tam Doğrulama"}
          </Text>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Belgeleriniz ekibimiz tarafından inceleniyor. Bu işlem genellikle 24 saat içinde
          tamamlanır.
        </Text>

        {/* Timeline */}
        <View style={[styles.timelineBox, { backgroundColor: colors.surface }]}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: config.iconColor }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>
                Başvuru Gönderildi
              </Text>
              {profile.pendingApplication?.submittedAt && (
                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                  {new Date(profile.pendingApplication.submittedAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />

          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                styles.timelineDotPending,
                { borderColor: config.iconColor }
              ]}
            />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitle, { color: colors.textMuted }]}>
                İnceleme Aşamasında
              </Text>
              <Text style={[styles.timelineDate, { color: colors.textMuted }]}>Bekleniyor...</Text>
            </View>
          </View>
        </View>

        {/* Info hint */}
        <View
          style={[
            styles.hintBox,
            { backgroundColor: config.iconBg, borderColor: `${config.iconColor}30` }
          ]}
        >
          <Info size={16} color={config.iconColor} />
          <Text style={[styles.hintText, { color: config.iconColor }]}>
            Sonuç hakkında bildirim alacaksınız.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Rejected View
// ─────────────────────────────────────────────────────────

function RejectedView({
  profile,
  styles,
  colors,
  scaleAnim,
  fadeAnim,
  onStart
}: {
  profile: KYCProfile;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  onStart: () => void;
}) {
  const config = STATUS_CONFIG.rejected;

  return (
    <View style={styles.container}>
      {/* Rejected Icon */}
      <Animated.View
        style={[
          styles.iconWrapper,
          { backgroundColor: config.iconBg, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={[styles.iconInner, { backgroundColor: config.iconColor }]}>
          <XCircle size={40} color="#fff" strokeWidth={2} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: config.iconColor }]}>Başvuru Reddedildi</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Maalesef başvurunuz onaylanamadı. Aşağıdaki nedeni inceleyip yeni bir başvuru
          yapabilirsiniz.
        </Text>

        {/* Rejection Reason */}
        {profile.lastRejection?.reason && (
          <View
            style={[
              styles.reasonBox,
              { backgroundColor: config.iconBg, borderColor: `${config.iconColor}30` }
            ]}
          >
            <View style={styles.reasonHeader}>
              <AlertTriangle size={18} color={config.iconColor} />
              <Text style={[styles.reasonTitle, { color: config.iconColor }]}>Red Nedeni</Text>
            </View>
            <Text style={[styles.reasonText, { color: colors.textPrimary }]}>
              {profile.lastRejection.reason}
            </Text>
            {profile.lastRejection.rejectedAt && (
              <Text style={[styles.reasonDate, { color: colors.textMuted }]}>
                {new Date(profile.lastRejection.rejectedAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </Text>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipsBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
            Yeniden Başvuru İçin
          </Text>
          <View style={styles.tipItem}>
            <CheckCircle size={14} color="#10B981" />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Kimlik fotoğrafının net ve okunaklı olduğundan emin olun
            </Text>
          </View>
          <View style={styles.tipItem}>
            <CheckCircle size={14} color="#10B981" />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Selfie'de yüzünüzün tam görünür olmasına dikkat edin
            </Text>
          </View>
          <View style={styles.tipItem}>
            <CheckCircle size={14} color="#10B981" />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Bilgilerinizin kimlikle eşleştiğini kontrol edin
            </Text>
          </View>
        </View>

        {/* Cooldown Warning */}
        {profile.cooldown?.until && new Date(profile.cooldown.until) > new Date() && (
          <CooldownWarning until={profile.cooldown.until} colors={colors} styles={styles} />
        )}

        {/* Retry Button */}
        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor: profile.canApply === false ? colors.border : colors.accent,
              opacity: profile.canApply === false ? 0.6 : 1
            }
          ]}
          onPress={onStart}
          disabled={profile.canApply === false}
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {profile.canApply === false ? "Bekleme Süresinde" : "Yeniden Başvur"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Cooldown Warning Component
// ─────────────────────────────────────────────────────────

function CooldownWarning({
  until,
  colors,
  styles
}: {
  until: string;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const cooldownDate = new Date(until);
  const now = new Date();
  const diffMs = cooldownDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  let timeText = "";
  if (diffDays > 1) {
    timeText = `${diffDays} gün`;
  } else if (diffHours > 1) {
    timeText = `${diffHours} saat`;
  } else {
    timeText = "1 saatten az";
  }

  return (
    <View style={[styles.cooldownBox, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B30" }]}>
      <View style={styles.cooldownHeader}>
        <Timer size={18} color="#F59E0B" />
        <Text style={[styles.cooldownTitle, { color: "#F59E0B" }]}>Bekleme Süresi</Text>
      </View>
      <Text style={[styles.cooldownText, { color: colors.textSecondary }]}>
        Yeni başvuru yapabilmek için {timeText} beklemeniz gerekiyor.
      </Text>
      <Text style={[styles.cooldownDate, { color: colors.textMuted }]}>
        Başvuru açılış:{" "}
        {cooldownDate.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit"
        })}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Start View (None status)
// ─────────────────────────────────────────────────────────

function StartView({
  styles,
  colors,
  hasProgress,
  onStart,
  onReset,
  scaleAnim,
  fadeAnim
}: {
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  hasProgress?: boolean;
  onStart: () => void;
  onReset?: () => void;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
}) {
  const config = STATUS_CONFIG.none;

  return (
    <View style={styles.container}>
      {/* Shield Icon */}
      <Animated.View
        style={[
          styles.iconWrapper,
          { backgroundColor: config.iconBg, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={[styles.iconInner, { backgroundColor: config.iconColor }]}>
          <Shield size={40} color="#fff" strokeWidth={2} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kimlik Doğrulama</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Para çekmek için kimlik doğrulaması yapmanız gerekiyor. Bu işlem sadece bir kez yapılır ve
          bilgileriniz güvenle saklanır.
        </Text>

        {/* Steps */}
        <View style={[styles.stepsBox, { backgroundColor: colors.surface }]}>
          <StepItem
            number={1}
            text="Kişisel bilgilerinizi girin"
            colors={colors}
            accent={config.iconColor}
          />
          <StepItem
            number={2}
            text="Kimliğinizin ön ve arka yüzünü çekin"
            colors={colors}
            accent={config.iconColor}
          />
          <StepItem
            number={3}
            text="Yüz doğrulama için selfie çekin"
            colors={colors}
            accent={config.iconColor}
          />
        </View>

        {/* Security Note */}
        <View style={[styles.hintBox, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}>
          <ShieldCheck size={16} color="#10B981" />
          <Text style={[styles.hintText, { color: "#10B981" }]}>
            Verileriniz şifrelenerek güvenle saklanır.
          </Text>
        </View>

        {/* Start Button */}
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={onStart}
        >
          <Text style={styles.primaryButtonText}>
            {hasProgress ? "Devam Et" : "Doğrulamayı Başlat"}
          </Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>

        {/* Reset Button */}
        {hasProgress && onReset && (
          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={onReset}
          >
            <RefreshCw size={16} color={colors.textMuted} />
            <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>
              Yeniden Başla
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Step Item Component
// ─────────────────────────────────────────────────────────

function StepItem({
  number,
  text,
  colors,
  accent
}: {
  number: number;
  text: string;
  colors: ThemeColors;
  accent: string;
}) {
  return (
    <View style={stepStyles.container}>
      <View style={[stepStyles.number, { backgroundColor: `${accent}15` }]}>
        <Text style={[stepStyles.numberText, { color: accent }]}>{number}</Text>
      </View>
      <Text style={[stepStyles.text, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  numberText: {
    fontSize: 13,
    fontWeight: "600"
  },
  text: {
    flex: 1,
    fontSize: 14
  }
});

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 20
    },
    iconWrapper: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24
    },
    iconInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8
    },
    content: {
      width: "100%",
      alignItems: "center"
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center"
    },
    levelBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 12
    },
    levelText: {
      fontSize: 12,
      fontWeight: "600"
    },
    description: {
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      paddingHorizontal: 20,
      marginBottom: 20
    },
    infoCards: {
      width: "100%",
      gap: 10,
      marginBottom: 16
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 12,
      gap: 12
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center"
    },
    infoContent: {
      flex: 1
    },
    infoLabel: {
      fontSize: 11,
      marginBottom: 2
    },
    infoValue: {
      fontSize: 15,
      fontWeight: "600"
    },
    hintBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      width: "100%"
    },
    hintText: {
      flex: 1,
      fontSize: 13
    },
    timelineBox: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      marginBottom: 16
    },
    timelineItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginTop: 4
    },
    timelineDotPending: {
      backgroundColor: "transparent",
      borderWidth: 2
    },
    timelineLine: {
      width: 2,
      height: 20,
      marginLeft: 5,
      marginVertical: 4
    },
    timelineContent: {
      flex: 1
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: "500"
    },
    timelineDate: {
      fontSize: 12,
      marginTop: 2
    },
    reasonBox: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 16
    },
    reasonHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    },
    reasonTitle: {
      fontSize: 14,
      fontWeight: "600"
    },
    reasonText: {
      fontSize: 14,
      lineHeight: 20
    },
    reasonDate: {
      fontSize: 12,
      marginTop: 8
    },
    tipsBox: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      marginBottom: 20
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 12
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 8
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18
    },
    stepsBox: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      marginBottom: 16
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
      paddingVertical: 16,
      borderRadius: 14,
      marginTop: 8
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600"
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 12
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: "500"
    },
    // Cooldown styles
    cooldownBox: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 16
    },
    cooldownHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    },
    cooldownTitle: {
      fontSize: 14,
      fontWeight: "600"
    },
    cooldownText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4
    },
    cooldownDate: {
      fontSize: 12,
      marginTop: 4
    }
  });
