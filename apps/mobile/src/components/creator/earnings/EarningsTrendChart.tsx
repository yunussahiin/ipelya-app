/**
 * EarningsTrendChart Component
 * Günlük kazanç trend grafiği
 */

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 160;

interface DailyTrend {
  day: string;
  total_coins: number;
  subscription_coins: number;
  gift_coins: number;
}

interface EarningsTrendChartProps {
  data: DailyTrend[];
  isLoading?: boolean;
}

export function EarningsTrendChart({ data, isLoading }: EarningsTrendChartProps) {
  const { colors } = useTheme();

  if (isLoading || data.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Günlük Trend</Text>
        <View style={[styles.placeholder, { backgroundColor: colors.backgroundRaised }]}>
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            {isLoading ? "Yükleniyor..." : "Henüz veri yok"}
          </Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.total_coins), 1);
  const barWidth = (CHART_WIDTH - 40) / data.length - 4;

  const formatDay = (dayStr: string) => {
    const date = new Date(dayStr);
    return date.toLocaleDateString("tr-TR", { weekday: "short" }).slice(0, 2);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Günlük Trend</Text>

      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.yLabel, { color: colors.textMuted }]}>
            {maxValue.toLocaleString("tr-TR")}
          </Text>
          <Text style={[styles.yLabel, { color: colors.textMuted }]}>
            {Math.round(maxValue / 2).toLocaleString("tr-TR")}
          </Text>
          <Text style={[styles.yLabel, { color: colors.textMuted }]}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const height = (item.total_coins / maxValue) * (CHART_HEIGHT - 30);
            const subscriptionHeight = (item.subscription_coins / maxValue) * (CHART_HEIGHT - 30);

            return (
              <View key={item.day} style={styles.barWrapper}>
                <View style={[styles.bar, { height: CHART_HEIGHT - 30 }]}>
                  {/* Gift portion */}
                  <View
                    style={[
                      styles.barSegment,
                      {
                        height: Math.max(height - subscriptionHeight, 0),
                        backgroundColor: "#F59E0B",
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4
                      }
                    ]}
                  />
                  {/* Subscription portion */}
                  <View
                    style={[
                      styles.barSegment,
                      {
                        height: subscriptionHeight,
                        backgroundColor: colors.accent,
                        borderTopLeftRadius: height === subscriptionHeight ? 4 : 0,
                        borderTopRightRadius: height === subscriptionHeight ? 4 : 0
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.xLabel, { color: colors.textMuted }]}>
                  {formatDay(item.day)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Abonelik</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hediye</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16
  },
  placeholder: {
    height: CHART_HEIGHT,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderText: {
    fontSize: 14
  },
  chartContainer: {
    flexDirection: "row",
    height: CHART_HEIGHT
  },
  yAxis: {
    width: 40,
    justifyContent: "space-between",
    paddingBottom: 20
  },
  yLabel: {
    fontSize: 10,
    textAlign: "right"
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 20
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
    maxWidth: 40
  },
  bar: {
    width: "70%",
    justifyContent: "flex-end"
  },
  barSegment: {
    width: "100%"
  },
  xLabel: {
    fontSize: 10,
    marginTop: 4
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 12
  }
});
