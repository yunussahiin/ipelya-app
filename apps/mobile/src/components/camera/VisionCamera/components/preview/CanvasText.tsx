/**
 * DraggableTextOverlay
 *
 * Fotoğraf üzerinde sürüklenebilir text overlay
 * React Native View olarak render edilir (Canvas dışında)
 * - Bounds kontrolü (fotoğraf dışına çıkmaz)
 * - Single tap to edit desteği
 * - Alignment desteği (sol/orta/sağ)
 * - Font stilleri desteği
 */

import React, { useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from "react-native";
import type { TextItem } from "./TextEditor";
import * as Haptics from "expo-haptics";

const LOG_PREFIX = "[DraggableText]";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Font weight mapping
const FONT_WEIGHTS: Record<string, "300" | "400" | "500" | "600" | "700" | "900"> = {
  modern: "700",
  classic: "400",
  neon: "900",
  typewriter: "300",
  handwritten: "500"
};

// Text style mapping
const TEXT_STYLES: Record<string, { hasBackground: boolean; hasShadow: boolean }> = {
  plain: { hasBackground: false, hasShadow: true },
  highlight: { hasBackground: true, hasShadow: false },
  neon: { hasBackground: false, hasShadow: true },
  outline: { hasBackground: false, hasShadow: false }
};

interface DraggableTextOverlayProps {
  /** Text item'ları */
  items: TextItem[];
  /** Item pozisyonu güncelle */
  onPositionChange: (id: string, x: number, y: number) => void;
  /** Item'a tıklandığında düzenleme için */
  onItemTap?: (item: TextItem) => void;
  /** Container bounds (fotoğraf alanı) */
  bounds?: { width: number; height: number; top: number };
}

/**
 * Tek bir sürüklenebilir text item
 */
function DraggableTextItem({
  item,
  onPositionChange,
  onItemTap,
  bounds
}: {
  item: TextItem;
  onPositionChange: (id: string, x: number, y: number) => void;
  onItemTap?: (item: TextItem) => void;
  bounds?: { width: number; height: number; top: number };
}) {
  // Alignment'a göre başlangıç X pozisyonu hesapla
  const getAlignedX = useCallback(() => {
    if (!bounds) return item.x;
    const padding = 20;
    switch (item.alignment) {
      case "left":
        return padding;
      case "right":
        return bounds.width - padding;
      case "center":
      default:
        return bounds.width / 2;
    }
  }, [bounds, item.alignment, item.x]);

  const pan = useRef(new Animated.ValueXY({ x: getAlignedX(), y: item.y })).current;
  const isDragging = useRef(false);
  const gestureStartTime = useRef<number>(0);

  // Item pozisyonu değiştiğinde pan'ı güncelle
  useEffect(() => {
    const newX = getAlignedX();
    pan.setValue({ x: newX, y: item.y });
    console.log(
      `${LOG_PREFIX} Position updated for "${item.text}": x=${newX}, y=${item.y}, alignment=${item.alignment}`
    );
  }, [item.x, item.y, item.alignment, getAlignedX, pan, item.text]);

  // Bounds kontrolü
  const clampPosition = useCallback(
    (x: number, y: number) => {
      if (!bounds) {
        console.log(`${LOG_PREFIX} No bounds, returning original position`);
        return { x, y };
      }

      const padding = 20;
      const minX = padding;
      const maxX = bounds.width - padding;
      const minY = bounds.top + padding;
      const maxY = bounds.top + bounds.height - padding;

      const clamped = {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y))
      };

      console.log(
        `${LOG_PREFIX} Clamp: input(${x.toFixed(0)}, ${y.toFixed(0)}) -> output(${clamped.x.toFixed(0)}, ${clamped.y.toFixed(0)}), bounds: w=${bounds.width}, h=${bounds.height}`
      );
      return clamped;
    },
    [bounds]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        gestureStartTime.current = Date.now();
        pan.setOffset({
          x: (pan.x as unknown as { _value: number })._value,
          y: (pan.y as unknown as { _value: number })._value
        });
        pan.setValue({ x: 0, y: 0 });
        console.log(`${LOG_PREFIX} Gesture started on "${item.text}"`);
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false
        })(_, gestureState);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const x = (pan.x as unknown as { _value: number })._value;
        const y = (pan.y as unknown as { _value: number })._value;
        const gestureDuration = Date.now() - gestureStartTime.current;

        console.log(
          `${LOG_PREFIX} Gesture ended: isDragging=${isDragging.current}, duration=${gestureDuration}ms`
        );

        // Bounds kontrolü
        const clamped = clampPosition(x, y);

        // Eğer bounds dışına çıktıysa, animasyonla geri getir
        if (clamped.x !== x || clamped.y !== y) {
          console.log(`${LOG_PREFIX} Out of bounds, animating back`);
          Animated.spring(pan, {
            toValue: { x: clamped.x, y: clamped.y },
            useNativeDriver: false,
            friction: 7
          }).start();
        }

        onPositionChange(item.id, clamped.x, clamped.y);

        // Tap kontrolü - kısa dokunuş (< 200ms) ve hareket yok ise edit aç
        if (!isDragging.current && gestureDuration < 200 && onItemTap) {
          console.log(`${LOG_PREFIX} TAP detected on "${item.text}", opening editor`);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onItemTap(item);
        } else if (isDragging.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    })
  ).current;

  // Text style
  const textStyle = TEXT_STYLES[item.textStyleId] || TEXT_STYLES.plain;
  const fontWeight = FONT_WEIGHTS[item.fontStyleId] || "700";

  return (
    <Animated.View
      style={[
        styles.textItem,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }]
        },
        textStyle.hasBackground && {
          backgroundColor: item.color,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Text
        style={[
          styles.text,
          {
            color: textStyle.hasBackground
              ? item.color === "#FFFFFF"
                ? "#000"
                : "#FFF"
              : item.color,
            fontSize: Math.min(item.fontSize, 56),
            fontWeight,
            textAlign: item.alignment,
            textShadowColor: textStyle.hasShadow ? "rgba(0,0,0,0.75)" : "transparent",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: textStyle.hasShadow ? 3 : 0,
            maxWidth: SCREEN_WIDTH - 60
          }
        ]}
      >
        {item.text}
      </Text>
    </Animated.View>
  );
}

/**
 * DraggableTextOverlay Component
 *
 * Canvas üzerinde absolute positioned olarak render edilir
 */
export function DraggableTextOverlay({
  items,
  onPositionChange,
  onItemTap,
  bounds
}: DraggableTextOverlayProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {items.map((item) => (
        <DraggableTextItem
          key={item.id}
          item={item}
          onPositionChange={onPositionChange}
          onItemTap={onItemTap}
          bounds={bounds}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10
  },
  textItem: {
    position: "absolute",
    padding: 8
  },
  text: {
    fontWeight: "700"
  }
});

export default DraggableTextOverlay;
