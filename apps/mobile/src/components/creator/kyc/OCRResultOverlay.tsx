/**
 * OCRResultOverlay Component
 * KYC Kimlik çekimi için OCR sonuç overlay'i
 *
 * Özellikler:
 * - Algılanan bilgilerin gösterimi
 * - Güven skoru bar
 * - Kimlik kartı çerçevesi
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import Svg, { Rect, Defs, Mask, G, Line } from "react-native-svg";
import { Check, X, AlertCircle } from "lucide-react-native";
import type { OCRResult } from "@/hooks/creator/useIDCardOCR";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Kimlik kartı boyutları (kredi kartı oranı: 85.6 × 53.98 mm)
const CARD_ASPECT_RATIO = 1.586;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;
const CARD_CENTER_X = SCREEN_WIDTH / 2;
const CARD_CENTER_Y = SCREEN_HEIGHT * 0.4;
const CARD_LEFT = CARD_CENTER_X - CARD_WIDTH / 2;
const CARD_TOP = CARD_CENTER_Y - CARD_HEIGHT / 2;

interface OCRResultOverlayProps {
  result: OCRResult;
  showDetails?: boolean;
}

export function OCRResultOverlay({ result, showDetails = true }: OCRResultOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isReady = result.isComplete;
  const borderColor = isReady ? "#10B981" : result.confidence > 0 ? "#F59E0B" : "#fff";

  // Güven skoru animasyonu
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: result.confidence,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [result.confidence, progressAnim]);

  // Ready durumunda pulse
  useEffect(() => {
    if (isReady) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isReady, pulseAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Karartılmış arka plan + kart kesimi */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <Mask id="cardMask">
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
            <Rect
              x={CARD_LEFT}
              y={CARD_TOP}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              rx={12}
              ry={12}
              fill="black"
            />
          </Mask>
        </Defs>

        {/* Karartılmış alan */}
        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(0,0,0,0.6)"
          mask="url(#cardMask)"
        />

        {/* Kart çerçevesi */}
        <Rect
          x={CARD_LEFT}
          y={CARD_TOP}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          rx={12}
          ry={12}
          stroke={borderColor}
          strokeWidth={3}
          fill="none"
        />

        {/* Köşe işaretleri */}
        <G stroke={borderColor} strokeWidth={4}>
          {/* Sol üst */}
          <Line x1={CARD_LEFT} y1={CARD_TOP + 30} x2={CARD_LEFT} y2={CARD_TOP} />
          <Line x1={CARD_LEFT} y1={CARD_TOP} x2={CARD_LEFT + 30} y2={CARD_TOP} />

          {/* Sağ üst */}
          <Line
            x1={CARD_LEFT + CARD_WIDTH - 30}
            y1={CARD_TOP}
            x2={CARD_LEFT + CARD_WIDTH}
            y2={CARD_TOP}
          />
          <Line
            x1={CARD_LEFT + CARD_WIDTH}
            y1={CARD_TOP}
            x2={CARD_LEFT + CARD_WIDTH}
            y2={CARD_TOP + 30}
          />

          {/* Sol alt */}
          <Line
            x1={CARD_LEFT}
            y1={CARD_TOP + CARD_HEIGHT - 30}
            x2={CARD_LEFT}
            y2={CARD_TOP + CARD_HEIGHT}
          />
          <Line
            x1={CARD_LEFT}
            y1={CARD_TOP + CARD_HEIGHT}
            x2={CARD_LEFT + 30}
            y2={CARD_TOP + CARD_HEIGHT}
          />

          {/* Sağ alt */}
          <Line
            x1={CARD_LEFT + CARD_WIDTH - 30}
            y1={CARD_TOP + CARD_HEIGHT}
            x2={CARD_LEFT + CARD_WIDTH}
            y2={CARD_TOP + CARD_HEIGHT}
          />
          <Line
            x1={CARD_LEFT + CARD_WIDTH}
            y1={CARD_TOP + CARD_HEIGHT - 30}
            x2={CARD_LEFT + CARD_WIDTH}
            y2={CARD_TOP + CARD_HEIGHT}
          />
        </G>
      </Svg>

      {/* Talimat metni */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Kimlik kartınızı çerçeveye yerleştirin</Text>
      </View>

      {/* OCR sonuçları */}
      {showDetails && (
        <View style={styles.resultsContainer}>
          {/* Güven skoru bar */}
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Okuma Kalitesi</Text>
            <View style={styles.confidenceBar}>
              <Animated.View
                style={[
                  styles.confidenceFill,
                  {
                    width: progressWidth,
                    backgroundColor:
                      result.confidence > 0.7
                        ? "#10B981"
                        : result.confidence > 0.3
                          ? "#F59E0B"
                          : "#EF4444"
                  }
                ]}
              />
            </View>
            <Text style={styles.confidencePercent}>{Math.round(result.confidence * 100)}%</Text>
          </View>

          {/* Algılanan bilgiler */}
          <View style={styles.dataContainer}>
            <DataRow label="TC Kimlik No" value={result.data.tcNumber} masked={true} />
            <DataRow
              label="Ad Soyad"
              value={
                result.data.firstName || result.data.lastName
                  ? `${result.data.firstName || ""} ${result.data.lastName || ""}`.trim()
                  : undefined
              }
            />
            <DataRow
              label="Doğum Tarihi"
              value={result.data.birthDate ? formatDate(result.data.birthDate) : undefined}
            />
            <DataRow
              label="Geçerlilik"
              value={result.data.expiryDate ? formatDate(result.data.expiryDate) : undefined}
              isExpired={result.data.expiryDate ? isExpired(result.data.expiryDate) : false}
            />
          </View>

          {/* Durum mesajı */}
          <View style={[styles.statusContainer, { backgroundColor: `${borderColor}20` }]}>
            {isReady ? (
              <>
                <Check size={18} color="#10B981" />
                <Text style={[styles.statusText, { color: "#10B981" }]}>
                  Bilgiler okundu, fotoğraf çekebilirsiniz
                </Text>
              </>
            ) : result.confidence > 0 ? (
              <>
                <AlertCircle size={18} color="#F59E0B" />
                <Text style={[styles.statusText, { color: "#F59E0B" }]}>
                  Kimliği daha net tutun
                </Text>
              </>
            ) : (
              <>
                <AlertCircle size={18} color="#fff" />
                <Text style={[styles.statusText, { color: "#fff" }]}>Kimlik kartı algılanmadı</Text>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

interface DataRowProps {
  label: string;
  value?: string;
  masked?: boolean;
  isExpired?: boolean;
}

function DataRow({ label, value, masked, isExpired }: DataRowProps) {
  const displayValue = value
    ? masked
      ? `${value.slice(0, 3)}****${value.slice(-2)}`
      : value
    : "-";

  const textColor = isExpired ? "#EF4444" : value ? "#fff" : "#6B7280";

  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <View style={styles.dataValueContainer}>
        {isExpired ? (
          <X size={14} color="#EF4444" />
        ) : value ? (
          <Check size={14} color="#10B981" />
        ) : (
          <X size={14} color="#6B7280" />
        )}
        <Text style={[styles.dataValue, { color: textColor }]}>
          {displayValue}
          {isExpired && " (Süresi dolmuş)"}
        </Text>
      </View>
    </View>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

function isExpired(isoDate: string): boolean {
  const expiry = new Date(isoDate);
  return expiry < new Date();
}

const styles = StyleSheet.create({
  instructionContainer: {
    position: "absolute",
    top: CARD_TOP - 50,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center"
  },
  resultsContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 16,
    padding: 16
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10
  },
  confidenceLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    width: 80
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden"
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3
  },
  confidencePercent: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    width: 40,
    textAlign: "right"
  },
  dataContainer: {
    gap: 8,
    marginBottom: 12
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dataLabel: {
    color: "#9CA3AF",
    fontSize: 13
  },
  dataValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  dataValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500"
  },
  dataValueEmpty: {
    color: "#6B7280"
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500"
  }
});

export default OCRResultOverlay;
