/**
 * FilterPresets
 *
 * Instagram tarzı fotoğraf filtreleri
 * ColorMatrix 5x4 format: [R, G, B, A, offset] x 4 satır
 *
 * Her satır bir renk kanalını temsil eder:
 * - Satır 1: Red output
 * - Satır 2: Green output
 * - Satır 3: Blue output
 * - Satır 4: Alpha output
 */

export interface FilterPreset {
  id: string;
  name: string;
  /** 5x4 = 20 elemanlı ColorMatrix */
  matrix: number[];
  /** Önizleme için thumbnail rengi */
  previewColor?: string;
}

// Identity matrix (orijinal görüntü)
const IDENTITY: number[] = [
  1, 0, 0, 0, 0,  // R
  0, 1, 0, 0, 0,  // G
  0, 0, 1, 0, 0,  // B
  0, 0, 0, 1, 0,  // A
];

// Siyah-Beyaz (Grayscale)
const GRAYSCALE: number[] = [
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0, 0, 0, 1, 0,
];

// Sepia (Vintage kahverengi ton)
const SEPIA: number[] = [
  0.393, 0.769, 0.189, 0, 0,
  0.349, 0.686, 0.168, 0, 0,
  0.272, 0.534, 0.131, 0, 0,
  0, 0, 0, 1, 0,
];

// Warm (Sıcak tonlar)
const WARM: number[] = [
  1.2, 0, 0, 0, 0.1,
  0, 1.1, 0, 0, 0.05,
  0, 0, 0.9, 0, 0,
  0, 0, 0, 1, 0,
];

// Cool (Soğuk tonlar)
const COOL: number[] = [
  0.9, 0, 0, 0, 0,
  0, 1.0, 0, 0, 0.05,
  0, 0, 1.2, 0, 0.1,
  0, 0, 0, 1, 0,
];

// Vintage (Retro efekt)
const VINTAGE: number[] = [
  0.9, 0.1, 0.1, 0, 0.05,
  0.1, 0.8, 0.1, 0, 0.05,
  0.1, 0.1, 0.6, 0, 0.1,
  0, 0, 0, 1, 0,
];

// Dramatic (Yüksek kontrast)
const DRAMATIC: number[] = [
  1.3, 0, 0, 0, -0.15,
  0, 1.3, 0, 0, -0.15,
  0, 0, 1.3, 0, -0.15,
  0, 0, 0, 1, 0,
];

// Fade (Soluk efekt)
const FADE: number[] = [
  1, 0, 0, 0, 0.1,
  0, 1, 0, 0, 0.1,
  0, 0, 1, 0, 0.1,
  0, 0, 0, 0.9, 0,
];

// Vivid (Canlı renkler)
const VIVID: number[] = [
  1.4, -0.2, -0.2, 0, 0,
  -0.2, 1.4, -0.2, 0, 0,
  -0.2, -0.2, 1.4, 0, 0,
  0, 0, 0, 1, 0,
];

// Noir (Film noir)
const NOIR: number[] = [
  1.2, 0.1, 0.1, 0, -0.1,
  0.1, 1.2, 0.1, 0, -0.1,
  0.1, 0.1, 1.2, 0, -0.1,
  0, 0, 0, 1, 0,
];

// Bright (Parlak)
const BRIGHT: number[] = [
  1.1, 0, 0, 0, 0.1,
  0, 1.1, 0, 0, 0.1,
  0, 0, 1.1, 0, 0.1,
  0, 0, 0, 1, 0,
];

/**
 * Tüm filtre preset'leri
 */
export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'original', name: 'Orijinal', matrix: IDENTITY, previewColor: '#FFFFFF' },
  { id: 'vivid', name: 'Canlı', matrix: VIVID, previewColor: '#FF6B6B' },
  { id: 'warm', name: 'Sıcak', matrix: WARM, previewColor: '#FFB347' },
  { id: 'cool', name: 'Soğuk', matrix: COOL, previewColor: '#74B9FF' },
  { id: 'dramatic', name: 'Dramatik', matrix: DRAMATIC, previewColor: '#2D3436' },
  { id: 'vintage', name: 'Vintage', matrix: VINTAGE, previewColor: '#D4A574' },
  { id: 'sepia', name: 'Sepia', matrix: SEPIA, previewColor: '#C4A77D' },
  { id: 'grayscale', name: 'S/B', matrix: GRAYSCALE, previewColor: '#636E72' },
  { id: 'fade', name: 'Soluk', matrix: FADE, previewColor: '#DFE6E9' },
  { id: 'noir', name: 'Noir', matrix: NOIR, previewColor: '#1E272E' },
  { id: 'bright', name: 'Parlak', matrix: BRIGHT, previewColor: '#FFEAA7' },
];

/**
 * Brightness ayarı için matrix oluştur
 * @param value -1 ile 1 arası (-1: karanlık, 0: normal, 1: parlak)
 */
export function createBrightnessMatrix(value: number): number[] {
  const v = value * 0.5; // -0.5 ile 0.5 arası
  return [
    1, 0, 0, 0, v,
    0, 1, 0, 0, v,
    0, 0, 1, 0, v,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Contrast ayarı için matrix oluştur
 * @param value -1 ile 1 arası (-1: düşük, 0: normal, 1: yüksek)
 */
export function createContrastMatrix(value: number): number[] {
  const c = 1 + value; // 0 ile 2 arası
  const t = (1 - c) / 2;
  return [
    c, 0, 0, 0, t,
    0, c, 0, 0, t,
    0, 0, c, 0, t,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Saturation ayarı için matrix oluştur
 * @param value -1 ile 1 arası (-1: grayscale, 0: normal, 1: vivid)
 */
export function createSaturationMatrix(value: number): number[] {
  const s = 1 + value;
  const sr = (1 - s) * 0.299;
  const sg = (1 - s) * 0.587;
  const sb = (1 - s) * 0.114;
  return [
    sr + s, sg, sb, 0, 0,
    sr, sg + s, sb, 0, 0,
    sr, sg, sb + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * İki matrix'i çarp (compose)
 */
export function multiplyMatrices(a: number[], b: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i * 5 + k] * b[k * 5 + j];
      }
      if (j === 4) {
        sum += a[i * 5 + 4];
      }
      result.push(sum);
    }
  }
  return result;
}

/**
 * Filter + Adjustments birleştir
 */
export function combineFilterWithAdjustments(
  filterMatrix: number[],
  brightness: number,
  contrast: number,
  saturation: number
): number[] {
  let result = filterMatrix;
  
  if (brightness !== 0) {
    result = multiplyMatrices(createBrightnessMatrix(brightness), result);
  }
  
  if (contrast !== 0) {
    result = multiplyMatrices(createContrastMatrix(contrast), result);
  }
  
  if (saturation !== 0) {
    result = multiplyMatrices(createSaturationMatrix(saturation), result);
  }
  
  return result;
}

export default FILTER_PRESETS;
