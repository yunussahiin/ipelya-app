/**
 * TextEditorPreview
 *
 * Metin önizleme ve input alanı
 */

import React, { forwardRef, memo } from "react";
import { View, TextInput, StyleSheet, Dimensions } from "react-native";

import { FONT_STYLES, TEXT_STYLES } from "./constants";
import type { Alignment } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TextEditorPreviewProps {
  text: string;
  onChangeText: (text: string) => void;
  selectedColor: string;
  fontSize: number;
  fontStyleId: string;
  textStyleId: string;
  alignment: Alignment;
  keyboardHeight: number;
}

/**
 * TextEditorPreview Component
 */
export const TextEditorPreview = memo(
  forwardRef<TextInput, TextEditorPreviewProps>(function TextEditorPreview(
    {
      text,
      onChangeText,
      selectedColor,
      fontSize,
      fontStyleId,
      textStyleId,
      alignment,
      keyboardHeight
    },
    ref
  ) {
    const currentFontStyle = FONT_STYLES.find((f) => f.id === fontStyleId) || FONT_STYLES[0];
    const currentTextStyle = TEXT_STYLES.find((t) => t.id === textStyleId) || TEXT_STYLES[0];

    return (
      <View
        style={[
          styles.previewContainer,
          { marginBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 200 }
        ]}
      >
        <View
          style={[
            styles.textPreview,
            currentTextStyle.hasBackground && {
              backgroundColor: selectedColor,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }
          ]}
        >
          <TextInput
            ref={ref}
            style={[
              styles.textInput,
              {
                color: currentTextStyle.hasBackground
                  ? selectedColor === "#FFFFFF"
                    ? "#000"
                    : "#FFF"
                  : selectedColor,
                fontSize: Math.min(fontSize, 56),
                fontWeight: currentFontStyle.fontWeight,
                textAlign: alignment,
                textShadowColor: currentTextStyle.hasShadow ? "rgba(0,0,0,0.75)" : "transparent",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: currentTextStyle.hasShadow ? 3 : 0,
                maxWidth: SCREEN_WIDTH - 80
              }
            ]}
            value={text}
            onChangeText={onChangeText}
            placeholder="Metin yaz..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            autoFocus
            textAlignVertical="center"
          />
        </View>
      </View>
    );
  })
);

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40
  },
  textPreview: {
    maxWidth: SCREEN_WIDTH - 80
  },
  textInput: {
    textAlign: "center",
    minWidth: 100
  }
});
