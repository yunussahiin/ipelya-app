/**
 * TextEditor
 *
 * Fotoğraf üzerine metin ekleme editörü
 * - Font stilleri (Modern, Classic, Neon, vb.)
 * - Renk seçici
 * - Slider ile boyut ayarı
 * - Keyboard-aware layout
 */

import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Keyboard, Dimensions } from "react-native";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TextEditorPreview } from "./TextEditorPreview";
import { TextEditorToolbar } from "./TextEditorToolbar";
import { PanelContainer } from "./TextEditorPanels";
import { FontSizeSlider } from "./FontSizeSlider";
import {
  DEFAULT_COLOR,
  DEFAULT_FONT_STYLE_ID,
  DEFAULT_TEXT_STYLE_ID,
  DEFAULT_ALIGNMENT,
  FONT_SIZE_DEFAULT
} from "./constants";
import type { TextEditorProps, PanelType, Alignment, TextItem } from "./types";
import { ALIGNMENTS } from "./types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOG_PREFIX = "[TextEditor]";

/**
 * TextEditor Component
 */
export const TextEditor = memo(function TextEditor({
  isActive,
  onClose,
  onAddText,
  editingText,
  onUpdateText
}: TextEditorProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // State
  const [text, setText] = useState(editingText?.text || "");
  const [selectedColor, setSelectedColor] = useState(editingText?.color || DEFAULT_COLOR);
  const [fontSize, setFontSize] = useState(editingText?.fontSize || FONT_SIZE_DEFAULT);
  const [fontStyleId, setFontStyleId] = useState(editingText?.fontStyleId || DEFAULT_FONT_STYLE_ID);
  const [textStyleId, setTextStyleId] = useState(editingText?.textStyleId || DEFAULT_TEXT_STYLE_ID);
  const [alignment, setAlignment] = useState<Alignment>(
    editingText?.alignment || DEFAULT_ALIGNMENT
  );
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard listener
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Editor açıldığında focus
  useEffect(() => {
    if (isActive) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isActive]);

  // Editing text değiştiğinde state güncelle
  useEffect(() => {
    if (editingText) {
      setText(editingText.text);
      setSelectedColor(editingText.color);
      setFontSize(editingText.fontSize);
      setFontStyleId(editingText.fontStyleId);
      setTextStyleId(editingText.textStyleId);
      setAlignment(editingText.alignment);
    }
  }, [editingText]);

  // Reset state when closing
  useEffect(() => {
    if (!isActive) {
      setText("");
      setActivePanel(null);
    }
  }, [isActive]);

  // Alignment'a göre başlangıç X pozisyonu hesapla
  const getInitialX = useCallback(() => {
    const padding = 20;
    switch (alignment) {
      case "left":
        return padding;
      case "right":
        return SCREEN_WIDTH - padding;
      case "center":
      default:
        return SCREEN_WIDTH / 2;
    }
  }, [alignment]);

  // Handlers
  const handleDone = useCallback(() => {
    if (!text.trim()) {
      onClose();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const initialX = editingText?.x || getInitialX();

    const textItem: TextItem = {
      id: editingText?.id || Date.now().toString(),
      text: text.trim(),
      color: selectedColor,
      fontSize,
      fontStyleId,
      textStyleId,
      alignment,
      x: initialX,
      y: editingText?.y || SCREEN_HEIGHT / 3
    };

    console.log(
      `${LOG_PREFIX} Adding text: "${text.trim()}", alignment=${alignment}, x=${initialX}`
    );

    if (editingText && onUpdateText) {
      onUpdateText(textItem);
    } else {
      onAddText(textItem);
    }

    setText("");
    onClose();
  }, [
    text,
    selectedColor,
    fontSize,
    fontStyleId,
    textStyleId,
    alignment,
    editingText,
    onAddText,
    onUpdateText,
    onClose,
    getInitialX
  ]);

  const handleAlignmentToggle = useCallback(() => {
    Haptics.selectionAsync();
    const currentIndex = ALIGNMENTS.indexOf(alignment);
    const nextIndex = (currentIndex + 1) % ALIGNMENTS.length;
    const newAlignment = ALIGNMENTS[nextIndex];
    console.log(`${LOG_PREFIX} Alignment changed: ${alignment} -> ${newAlignment}`);
    setAlignment(newAlignment);
  }, [alignment]);

  const handleTogglePanel = useCallback(
    (panel: "font" | "color" | "style") => {
      Haptics.selectionAsync();
      console.log(`${LOG_PREFIX} Toggle panel: current=${activePanel}, new=${panel}`);
      setActivePanel((prev) => (prev === panel ? null : panel));
    },
    [activePanel]
  );

  const handleBackgroundToggle = useCallback(() => {
    Haptics.selectionAsync();
    const currentHasBackground =
      textStyleId === "highlight" || textStyleId === "neon" || textStyleId === "outline";
    setTextStyleId(currentHasBackground ? "plain" : "highlight");
  }, [textStyleId]);

  if (!isActive) return null;

  const bottomOffset = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#FFF" />
        </Pressable>
        <Pressable style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Bitti</Text>
        </Pressable>
      </View>

      {/* Text Preview */}
      <TextEditorPreview
        ref={inputRef}
        text={text}
        onChangeText={setText}
        selectedColor={selectedColor}
        fontSize={fontSize}
        fontStyleId={fontStyleId}
        textStyleId={textStyleId}
        alignment={alignment}
        keyboardHeight={keyboardHeight}
      />

      {/* Font Size Slider */}
      <FontSizeSlider
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        visible={keyboardHeight === 0}
      />

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { bottom: bottomOffset }]}>
        {/* Panels */}
        <PanelContainer
          activePanel={activePanel}
          fontStyleId={fontStyleId}
          selectedColor={selectedColor}
          textStyleId={textStyleId}
          onFontStyleSelect={setFontStyleId}
          onColorSelect={setSelectedColor}
          onTextStyleSelect={setTextStyleId}
        />

        {/* Toolbar */}
        <TextEditorToolbar
          activePanel={activePanel}
          selectedColor={selectedColor}
          textStyleId={textStyleId}
          alignment={alignment}
          onTogglePanel={handleTogglePanel}
          onAlignmentToggle={handleAlignmentToggle}
          onBackgroundToggle={handleBackgroundToggle}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  closeButton: {
    padding: 8
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600"
  },
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0
  }
});

// Re-export types
export type { TextItem, TextEditorProps, Alignment } from "./types";
export { ALIGNMENTS } from "./types";
