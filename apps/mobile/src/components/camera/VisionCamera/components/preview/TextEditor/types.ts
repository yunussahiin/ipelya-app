/**
 * TextEditor Types
 */

// Hizalama seçenekleri
export const ALIGNMENTS = ["left", "center", "right"] as const;
export type Alignment = (typeof ALIGNMENTS)[number];

// Panel tipleri
export type PanelType = "font" | "color" | "style" | null;

// Font stili
export interface FontStyle {
  id: string;
  name: string;
  fontFamily?: string;
  fontWeight: "300" | "400" | "500" | "600" | "700" | "900";
}

// Text stili
export interface TextStyleConfig {
  id: string;
  name: string;
  hasBackground: boolean;
  hasShadow: boolean;
  glowColor?: boolean;
  hasOutline?: boolean;
}

// Text item - fotoğraf üzerindeki metin
export interface TextItem {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  fontStyleId: string;
  textStyleId: string;
  alignment: Alignment;
  x: number;
  y: number;
}

// TextEditor props
export interface TextEditorProps {
  /** Editor aktif mi */
  isActive: boolean;
  /** Editor'ü kapat */
  onClose: () => void;
  /** Text ekle */
  onAddText: (item: TextItem) => void;
  /** Düzenlenen text (opsiyonel) */
  editingText?: TextItem | null;
  /** Text güncelle */
  onUpdateText?: (item: TextItem) => void;
}
