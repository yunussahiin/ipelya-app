/**
 * PhotoPreview
 *
 * Skia Canvas ile fotoğraf önizleme + filtre uygulama
 * - ColorMatrix ile real-time filtre
 * - Brightness/Contrast/Saturation ayarları
 * - Canvas export (filtrelenmiş görüntü kaydetme)
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated as RNAnimated
} from "react-native";
import {
  Canvas,
  Image,
  ColorMatrix,
  useImage,
  useCanvasRef,
  Skia,
  Group,
  RuntimeShader,
  Fill,
  ImageShader
} from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sliders, Sparkles, Type } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";

import { FilterSelector } from "./FilterSelector";
import { AdjustmentSlider } from "./AdjustmentSlider";
import { FILTER_PRESETS, FilterPreset, combineFilterWithAdjustments } from "./FilterPresets";
import { createVignetteShader, VIGNETTE_DEFAULTS, BackdropBlurEffect } from "./effects";
import { DraggableTextOverlay } from "./CanvasText";
import { TextEditor, TextItem } from "./TextEditor";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOG_PREFIX = "[PhotoPreview]";

// Tab types
type TabType = "filters" | "adjustments";

export interface PhotoPreviewRef {
  /** Filtrelenmiş görüntüyü kaydet ve URI döndür */
  exportImage: () => Promise<string | null>;
  /** Mevcut filtre ve ayarları al */
  getCurrentSettings: () => {
    filterId: string;
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

interface PhotoPreviewProps {
  /** Fotoğraf URI'si */
  uri: string;
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  const animatedValue = useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        }),
        RNAnimated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={styles.loadingContainer}>
      <RNAnimated.View style={[styles.loadingSkeleton, { opacity }]} />
      <Text style={styles.loadingText}>Yükleniyor...</Text>
    </View>
  );
}

/**
 * PhotoPreview Component
 */
export const PhotoPreview = forwardRef<PhotoPreviewRef, PhotoPreviewProps>(function PhotoPreview(
  { uri },
  ref
) {
  console.log(`${LOG_PREFIX} Rendering with uri:`, uri?.substring(0, 50));

  const insets = useSafeAreaInsets();
  const canvasRef = useCanvasRef();

  // useImage hook - potansiyel crash noktası
  let image = null;
  try {
    console.log(`${LOG_PREFIX} Calling useImage...`);
    image = useImage(uri);
    console.log(
      `${LOG_PREFIX} useImage result:`,
      image ? `${image.width()}x${image.height()}` : "null"
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} useImage CRASH:`, error);
  }

  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [vignetteEnabled, setVignetteEnabled] = useState(false);
  const [vignetteIntensity, setVignetteIntensity] = useState(1.2);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(10);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("filters");
  const [textEditorActive, setTextEditorActive] = useState(false);
  const [editingTextItem, setEditingTextItem] = useState<TextItem | null>(null);

  // Combined color matrix
  const colorMatrix = useMemo(() => {
    const matrix = combineFilterWithAdjustments(
      selectedFilter.matrix,
      brightness,
      contrast,
      saturation
    );
    console.log(`${LOG_PREFIX} ColorMatrix for ${selectedFilter.id}:`, matrix.slice(0, 5));
    return matrix;
  }, [selectedFilter, brightness, contrast, saturation]);

  // Vignette shader - bir kez oluştur
  const vignetteShader = useMemo(() => createVignetteShader(), []);

  // Calculate display dimensions
  const displayDimensions = useMemo(() => {
    if (!image) return { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, x: 0, y: 0 };

    const imageAspect = image.width() / image.height();
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    let displayWidth = SCREEN_WIDTH;
    let displayHeight = SCREEN_HEIGHT;

    if (imageAspect > screenAspect) {
      displayHeight = SCREEN_WIDTH / imageAspect;
    } else {
      displayWidth = SCREEN_HEIGHT * imageAspect;
    }

    return {
      width: displayWidth,
      height: displayHeight,
      x: (SCREEN_WIDTH - displayWidth) / 2,
      y: (SCREEN_HEIGHT - displayHeight) / 2
    };
  }, [image]);

  // Export image with filters applied
  const exportImage = useCallback(async (): Promise<string | null> => {
    if (!image || !canvasRef.current) {
      console.error(`${LOG_PREFIX} Cannot export: no image or canvas`);
      return null;
    }

    try {
      console.log(`${LOG_PREFIX} Exporting filtered image...`);

      // Create a new surface with original image dimensions
      const surface = Skia.Surface.Make(image.width(), image.height());
      if (!surface) {
        console.error(`${LOG_PREFIX} Failed to create surface`);
        return null;
      }

      const canvas = surface.getCanvas();

      // Create color filter
      const colorFilter = Skia.ColorFilter.MakeMatrix(colorMatrix);

      // Create paint with color filter
      const paint = Skia.Paint();
      paint.setColorFilter(colorFilter);

      // Draw image with filter
      canvas.drawImage(image, 0, 0, paint);

      // Get snapshot
      const snapshot = surface.makeImageSnapshot();
      if (!snapshot) {
        console.error(`${LOG_PREFIX} Failed to create snapshot`);
        return null;
      }

      // Encode to base64
      const base64 = snapshot.encodeToBase64();
      if (!base64) {
        console.error(`${LOG_PREFIX} Failed to encode image`);
        return null;
      }

      // Save to temp file
      const tempPath = `${FileSystem.cacheDirectory}filtered_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempPath, base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      console.log(`${LOG_PREFIX} Exported to: ${tempPath}`);
      return tempPath;
    } catch (error) {
      console.error(`${LOG_PREFIX} Export error:`, error);
      return null;
    }
  }, [image, colorMatrix, canvasRef]);

  // Get current settings
  const getCurrentSettings = useCallback(() => {
    return {
      filterId: selectedFilter.id,
      brightness,
      contrast,
      saturation
    };
  }, [selectedFilter, brightness, contrast, saturation]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportImage,
    getCurrentSettings
  }));

  // Handlers
  const handleFilterSelect = useCallback((filter: FilterPreset) => {
    console.log(`${LOG_PREFIX} Filter selected: ${filter.id}`);
    setSelectedFilter(filter);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, []);

  const handleResetAdjustments = useCallback(() => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  }, []);

  // Vignette toggle handler
  const handleVignetteToggle = useCallback(() => {
    setVignetteEnabled((prev) => !prev);
    Haptics.selectionAsync();
  }, []);

  // Blur toggle handler
  const handleBlurToggle = useCallback(() => {
    setBlurEnabled((prev) => !prev);
    Haptics.selectionAsync();
  }, []);

  // Text pozisyon güncelle
  const handleTextPositionChange = useCallback((id: string, x: number, y: number) => {
    setTextItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)));
  }, []);

  // Text editor handlers
  const handleOpenTextEditor = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTextItem(null);
    setTextEditorActive(true);
  }, []);

  const handleCloseTextEditor = useCallback(() => {
    setTextEditorActive(false);
    setEditingTextItem(null);
  }, []);

  const handleAddText = useCallback((item: TextItem) => {
    setTextItems((prev) => [...prev, item]);
  }, []);

  const handleUpdateText = useCallback((item: TextItem) => {
    setTextItems((prev) => prev.map((t) => (t.id === item.id ? item : t)));
  }, []);

  // Check if any adjustments are applied
  const hasAdjustments =
    selectedFilter.id !== "original" ||
    brightness !== 0 ||
    contrast !== 0 ||
    saturation !== 0 ||
    vignetteEnabled ||
    blurEnabled ||
    textItems.length > 0;

  if (!image) {
    return <LoadingSkeleton />;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Canvas with filtered image */}
      <View style={styles.canvasContainer}>
        <Canvas ref={canvasRef} style={styles.canvas}>
          {/* Ana görüntü + ColorMatrix filtresi */}
          <Image
            image={image}
            x={displayDimensions.x}
            y={displayDimensions.y}
            width={displayDimensions.width}
            height={displayDimensions.height}
            fit="contain"
          >
            <ColorMatrix matrix={colorMatrix} />
          </Image>

          {/* Vignette overlay - aktifse */}
          {vignetteEnabled && vignetteShader && (
            <Group
              layer
              transform={[{ translateX: displayDimensions.x }, { translateY: displayDimensions.y }]}
            >
              <Fill>
                <RuntimeShader
                  source={vignetteShader}
                  uniforms={{
                    resolution: [displayDimensions.width, displayDimensions.height],
                    intensity: vignetteIntensity,
                    radius: VIGNETTE_DEFAULTS.radius,
                    softness: VIGNETTE_DEFAULTS.softness
                  }}
                >
                  <ImageShader
                    image={image}
                    fit="cover"
                    rect={{
                      x: 0,
                      y: 0,
                      width: displayDimensions.width,
                      height: displayDimensions.height
                    }}
                  />
                </RuntimeShader>
              </Fill>
            </Group>
          )}

          {/* Backdrop Blur - aktifse */}
          {blurEnabled && (
            <BackdropBlurEffect
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              blur={blurIntensity}
              position="bottom"
              coverage={0.35}
              overlayColor="rgba(0, 0, 0, 0.15)"
            />
          )}
        </Canvas>

        {/* Draggable Text Overlay */}
        <DraggableTextOverlay
          items={textItems}
          onPositionChange={handleTextPositionChange}
          onItemTap={(item) => {
            console.log("[PhotoPreview] Text item tapped:", item.text);
            setEditingTextItem(item);
            setTextEditorActive(true);
          }}
          bounds={{
            width: displayDimensions.width,
            height: displayDimensions.height,
            top: displayDimensions.y
          }}
        />
      </View>

      {/* Filter indicator */}
      {hasAdjustments && (
        <View style={styles.filterIndicator}>
          <Sparkles size={14} color="#FFF" />
          <Text style={styles.filterIndicatorText}>
            {selectedFilter.id !== "original" ? selectedFilter.name : "Düzenlenmiş"}
          </Text>
        </View>
      )}

      {/* Controls */}
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom }]}>
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <Pressable
            style={[styles.tab, activeTab === "filters" && styles.tabActive]}
            onPress={() => handleTabChange("filters")}
          >
            <Sparkles
              size={18}
              color={activeTab === "filters" ? "#FFF" : "rgba(255,255,255,0.5)"}
            />
            <Text style={[styles.tabText, activeTab === "filters" && styles.tabTextActive]}>
              Filtreler
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "adjustments" && styles.tabActive]}
            onPress={() => handleTabChange("adjustments")}
          >
            <Sliders
              size={18}
              color={activeTab === "adjustments" ? "#FFF" : "rgba(255,255,255,0.5)"}
            />
            <Text style={[styles.tabText, activeTab === "adjustments" && styles.tabTextActive]}>
              Ayarlar
            </Text>
          </Pressable>
          {/* Metin Ekleme Butonu */}
          <Pressable style={styles.tab} onPress={handleOpenTextEditor}>
            <Type size={18} color="rgba(255,255,255,0.5)" />
            <Text style={styles.tabText}>Metin</Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === "filters" ? (
          <FilterSelector
            imageUri={uri}
            selectedFilterId={selectedFilter.id}
            onFilterSelect={handleFilterSelect}
          />
        ) : (
          <View style={styles.adjustmentsContainer}>
            <AdjustmentSlider type="brightness" value={brightness} onChange={setBrightness} />
            <AdjustmentSlider type="contrast" value={contrast} onChange={setContrast} />
            <AdjustmentSlider type="saturation" value={saturation} onChange={setSaturation} />

            {/* Vignette Toggle */}
            <Pressable
              style={[styles.effectToggle, vignetteEnabled && styles.effectToggleActive]}
              onPress={handleVignetteToggle}
            >
              <View style={styles.effectToggleContent}>
                <Text style={styles.effectToggleLabel}>Vignette</Text>
                <Text style={styles.effectToggleHint}>Kenar karartma</Text>
              </View>
              <View
                style={[
                  styles.effectToggleSwitch,
                  vignetteEnabled && styles.effectToggleSwitchActive
                ]}
              >
                <View
                  style={[
                    styles.effectToggleKnob,
                    vignetteEnabled && styles.effectToggleKnobActive
                  ]}
                />
              </View>
            </Pressable>

            {/* Vignette Intensity Slider */}
            {vignetteEnabled && (
              <View style={styles.vignetteSlider}>
                <Text style={styles.vignetteSliderLabel}>
                  Yoğunluk: {Math.round(vignetteIntensity * 100)}%
                </Text>
                <View style={styles.vignetteSliderButtons}>
                  <Pressable
                    style={styles.vignetteButton}
                    onPress={() => setVignetteIntensity(Math.max(0.5, vignetteIntensity - 0.2))}
                  >
                    <Text style={styles.vignetteButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.vignetteSliderTrack}>
                    <View
                      style={[
                        styles.vignetteSliderFill,
                        { width: `${((vignetteIntensity - 0.5) / 1.5) * 100}%` }
                      ]}
                    />
                  </View>
                  <Pressable
                    style={styles.vignetteButton}
                    onPress={() => setVignetteIntensity(Math.min(2.0, vignetteIntensity + 0.2))}
                  >
                    <Text style={styles.vignetteButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Backdrop Blur Toggle */}
            <Pressable
              style={[styles.effectToggle, blurEnabled && styles.effectToggleActive]}
              onPress={handleBlurToggle}
            >
              <View style={styles.effectToggleContent}>
                <Text style={styles.effectToggleLabel}>Blur</Text>
                <Text style={styles.effectToggleHint}>Alt kısım bulanıklaştırma</Text>
              </View>
              <View
                style={[styles.effectToggleSwitch, blurEnabled && styles.effectToggleSwitchActive]}
              >
                <View
                  style={[styles.effectToggleKnob, blurEnabled && styles.effectToggleKnobActive]}
                />
              </View>
            </Pressable>

            {/* Blur Intensity Slider */}
            {blurEnabled && (
              <View style={styles.vignetteSlider}>
                <Text style={styles.vignetteSliderLabel}>Yoğunluk: {blurIntensity}</Text>
                <View style={styles.vignetteSliderButtons}>
                  <Pressable
                    style={styles.vignetteButton}
                    onPress={() => setBlurIntensity(Math.max(2, blurIntensity - 2))}
                  >
                    <Text style={styles.vignetteButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.vignetteSliderTrack}>
                    <View
                      style={[
                        styles.vignetteSliderFill,
                        { width: `${((blurIntensity - 2) / 18) * 100}%` }
                      ]}
                    />
                  </View>
                  <Pressable
                    style={styles.vignetteButton}
                    onPress={() => setBlurIntensity(Math.min(20, blurIntensity + 2))}
                  >
                    <Text style={styles.vignetteButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {(brightness !== 0 || contrast !== 0 || saturation !== 0) && (
              <Pressable style={styles.resetButton} onPress={handleResetAdjustments}>
                <Text style={styles.resetButtonText}>Sıfırla</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Text Editor */}
      <TextEditor
        isActive={textEditorActive}
        onClose={handleCloseTextEditor}
        onAddText={handleAddText}
        editingText={editingTextItem}
        onUpdateText={handleUpdateText}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  canvasContainer: {
    flex: 1
  },
  canvas: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000"
  },
  loadingText: {
    color: "#FFF",
    marginTop: 12,
    fontSize: 14
  },
  loadingSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)"
  },
  filterIndicator: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  filterIndicatorText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500"
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  tabSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.15)"
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500"
  },
  tabTextActive: {
    color: "#FFF"
  },
  adjustmentsContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingBottom: 10
  },
  resetButton: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8
  },
  resetButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500"
  },
  // Vignette Toggle Styles
  effectToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12
  },
  effectToggleActive: {
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  effectToggleContent: {
    flex: 1
  },
  effectToggleLabel: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  effectToggleHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2
  },
  effectToggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    paddingHorizontal: 2
  },
  effectToggleSwitchActive: {
    backgroundColor: "#4CAF50"
  },
  effectToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF"
  },
  effectToggleKnobActive: {
    alignSelf: "flex-end"
  },
  // Vignette Slider Styles
  vignetteSlider: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8
  },
  vignetteSliderLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginBottom: 8
  },
  vignetteSliderButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  vignetteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  vignetteButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600"
  },
  vignetteSliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2
  },
  vignetteSliderFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 2
  }
});

export default PhotoPreview;
