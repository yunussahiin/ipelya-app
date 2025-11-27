/**
 * FaceEffectOverlay Component
 *
 * Kamera üzerine yüz efektlerini render eden ana overlay component
 * Skia Canvas kullanarak GPU hızında render sağlar
 *
 * @module face-effects/FaceEffectOverlay
 *
 * Kullanım:
 * ```tsx
 * <FaceEffectOverlay
 *   faces={faces}
 *   effects={activeEffects}
 *   width={screenWidth}
 *   height={screenHeight}
 *   cameraPosition="front"
 * />
 * ```
 */

import React, { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";

import type { FaceEffectOverlayProps, FaceData, FaceEffectConfig } from "./types";

// Effects
import { GlassesEffect } from "./effects/GlassesEffect";
import { LipstickEffect } from "./effects/LipstickEffect";
import { SkinSmoothEffect } from "./effects/SkinSmoothEffect";
import { SparkleEffect } from "./effects/SparkleEffect";

// =============================================
// EFFECT RENDERER
// =============================================

interface EffectRendererProps {
  face: FaceData;
  effect: FaceEffectConfig;
  canvasWidth: number;
  canvasHeight: number;
  isMirrored: boolean;
}

/**
 * Efekt türüne göre doğru component'i render eder
 */
const EffectRenderer = memo(function EffectRenderer({
  face,
  effect,
  canvasWidth,
  canvasHeight,
  isMirrored
}: EffectRendererProps) {
  // Efekt kapalıysa render etme
  if (!effect.enabled) return null;

  // Ortak props
  const commonProps = {
    face,
    intensity: effect.intensity,
    canvasWidth,
    canvasHeight,
    isMirrored
  };

  // Efekt türüne göre component seç
  switch (effect.type) {
    // Aksesuarlar
    case "glasses":
    case "sunglasses":
      return <GlassesEffect {...commonProps} asset={effect.asset} variant={effect.type} />;

    // Makyaj
    case "lipstick":
      return <LipstickEffect {...commonProps} color={effect.color ?? "rgba(255, 0, 80, 0.4)"} />;

    // Güzellik
    case "skin_smooth":
      return <SkinSmoothEffect {...commonProps} />;

    // Parçacıklar
    case "sparkle":
      return <SparkleEffect {...commonProps} />;

    // Henüz implement edilmemiş efektler
    case "eyeliner":
    case "eyeshadow":
    case "blush":
    case "contour":
    case "skin_tone":
    case "glow":
    case "brighten":
    case "crown":
    case "hat":
    case "ears":
    case "cat_face":
    case "dog_face":
    case "bunny_face":
    case "anime_eyes":
    case "hearts":
    case "snow":
    case "glitter":
      // TODO: Bu efektler Phase 3'te implement edilecek
      console.log(`[FaceEffectOverlay] Effect not implemented: ${effect.type}`);
      return null;

    default:
      return null;
  }
});

// =============================================
// MAIN COMPONENT
// =============================================

/**
 * FaceEffectOverlay
 *
 * Kamera görüntüsü üzerine yüz efektlerini render eder
 * - Birden fazla yüz destekler
 * - Birden fazla efekt aynı anda çalışabilir
 * - Front kamera için mirror desteği
 */
export const FaceEffectOverlay = memo(function FaceEffectOverlay({
  faces,
  effects,
  width,
  height,
  cameraPosition,
  frameSize
}: FaceEffectOverlayProps) {
  // Frame boyutları (MLKit koordinatları) - landscape
  const FRAME_WIDTH = frameSize.width; // 1920
  const FRAME_HEIGHT = frameSize.height; // 1080

  // Koordinat dönüşümü: Frame (landscape) -> Ekran (portrait)
  // Frame: 1920x1080 (landscape), Ekran: 393x852 (portrait)
  //
  // Frame koordinatları:
  //   - x: 0-1920 (yatay, soldan sağa)
  //   - y: 0-1080 (dikey, yukarıdan aşağı)
  //
  // Ekran koordinatları (portrait):
  //   - x: 0-393 (yatay)
  //   - y: 0-852 (dikey)
  //
  // Dönüşüm: Frame 90° saat yönünde döndürülmüş
  //   - screen.x = frame.y * (screenWidth / frameHeight)
  //   - screen.y = frame.x * (screenHeight / frameWidth)
  //
  const scaledFaces = useMemo(() => {
    // Scale faktörleri (swap için)
    const scaleXFromY = width / FRAME_HEIGHT; // frame.y -> screen.x
    const scaleYFromX = height / FRAME_WIDTH; // frame.x -> screen.y

    const isFront = cameraPosition === "front";

    return faces.map((face) => {
      // Dönüşüm: frame.y -> screen.x, frame.x -> screen.y
      const transformPoint = (frameX: number, frameY: number) => {
        const screenX = frameY * scaleXFromY;
        const screenY = frameX * scaleYFromX;
        return {
          x: isFront ? width - screenX : screenX,
          y: screenY
        };
      };

      return {
        ...face,
        bounds: {
          x: face.bounds.y * scaleXFromY,
          y: face.bounds.x * scaleYFromX,
          width: face.bounds.height * scaleXFromY,
          height: face.bounds.width * scaleYFromX
        },
        landmarks: {
          leftEye: transformPoint(face.landmarks.leftEye.x, face.landmarks.leftEye.y),
          rightEye: transformPoint(face.landmarks.rightEye.x, face.landmarks.rightEye.y),
          noseTip: transformPoint(face.landmarks.noseTip.x, face.landmarks.noseTip.y),
          noseBase: transformPoint(face.landmarks.noseBase.x, face.landmarks.noseBase.y),
          leftEar: transformPoint(face.landmarks.leftEar.x, face.landmarks.leftEar.y),
          rightEar: transformPoint(face.landmarks.rightEar.x, face.landmarks.rightEar.y),
          leftMouth: transformPoint(face.landmarks.leftMouth.x, face.landmarks.leftMouth.y),
          rightMouth: transformPoint(face.landmarks.rightMouth.x, face.landmarks.rightMouth.y),
          bottomMouth: transformPoint(face.landmarks.bottomMouth.x, face.landmarks.bottomMouth.y),
          leftCheek: transformPoint(face.landmarks.leftCheek.x, face.landmarks.leftCheek.y),
          rightCheek: transformPoint(face.landmarks.rightCheek.x, face.landmarks.rightCheek.y)
        }
      };
    });
  }, [faces, width, height, FRAME_WIDTH, FRAME_HEIGHT, cameraPosition]);

  // Front kamera için mirror
  const isMirrored = cameraPosition === "front";

  // Aktif efektleri filtrele (hook'lar early return'den önce olmalı)
  const enabledEffects = useMemo(() => effects.filter((e) => e.enabled), [effects]);

  // Yüz veya efekt yoksa render etme
  if (faces.length === 0 || effects.length === 0 || enabledEffects.length === 0) {
    return null;
  }

  return (
    <Canvas style={[styles.canvas, { width, height }]}>
      {/* DEBUG: Landmark noktalarını göster */}
      {scaledFaces.map((face) => (
        <React.Fragment key={`debug-${face.id}`}>
          {/* Sol göz - Kırmızı */}
          <Circle cx={face.landmarks.leftEye.x} cy={face.landmarks.leftEye.y} r={8} color="red" />
          {/* Sağ göz - Mavi */}
          <Circle
            cx={face.landmarks.rightEye.x}
            cy={face.landmarks.rightEye.y}
            r={8}
            color="blue"
          />
          {/* Burun - Yeşil */}
          <Circle
            cx={face.landmarks.noseBase.x}
            cy={face.landmarks.noseBase.y}
            r={8}
            color="green"
          />
          {/* Ağız sol - Sarı */}
          <Circle
            cx={face.landmarks.leftMouth.x}
            cy={face.landmarks.leftMouth.y}
            r={6}
            color="yellow"
          />
          {/* Ağız sağ - Turuncu */}
          <Circle
            cx={face.landmarks.rightMouth.x}
            cy={face.landmarks.rightMouth.y}
            r={6}
            color="orange"
          />
          {/* Ağız alt - Pembe */}
          <Circle
            cx={face.landmarks.bottomMouth.x}
            cy={face.landmarks.bottomMouth.y}
            r={6}
            color="pink"
          />
          {/* Gözler arası çizgi */}
          <Line
            p1={vec(face.landmarks.leftEye.x, face.landmarks.leftEye.y)}
            p2={vec(face.landmarks.rightEye.x, face.landmarks.rightEye.y)}
            color="white"
            strokeWidth={2}
          />
        </React.Fragment>
      ))}

      {/* Her yüz için efektleri render et (scaled koordinatlarla) */}
      {scaledFaces.map((face) => (
        <React.Fragment key={face.id}>
          {enabledEffects.map((effect) => (
            <EffectRenderer
              key={`${face.id}-${effect.id}`}
              face={face}
              effect={effect}
              canvasWidth={width}
              canvasHeight={height}
              isMirrored={isMirrored}
            />
          ))}
        </React.Fragment>
      ))}
    </Canvas>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    top: 0,
    left: 0
  }
});

export default FaceEffectOverlay;
