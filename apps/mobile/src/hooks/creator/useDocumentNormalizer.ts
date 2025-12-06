/**
 * useDocumentNormalizer Hook
 * KYC Kimlik kartı belge algılama ve düzeltme
 * 
 * Özellikler:
 * - Belge kenar algılama
 * - Perspektif düzeltme
 * - Crop işlemi
 * 
 * vision-camera-dynamsoft-document-normalizer kullanır
 * VisionCamera frame processor olarak ücretsiz kullanılabilir
 */

import { useCallback, useState, useRef } from 'react';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Kimlik kartı oranı
const CARD_ASPECT_RATIO = 1.586; // 85.6 × 53.98 mm

export interface Point {
  x: number;
  y: number;
}

export interface DocumentDetectionResult {
  detected: boolean;
  corners?: [Point, Point, Point, Point]; // [topLeft, topRight, bottomRight, bottomLeft]
  confidence: number;
  isCardShaped: boolean; // Kimlik kartı şeklinde mi
}

export interface NormalizationResult {
  success: boolean;
  normalizedPath?: string;
  error?: string;
}

/**
 * Belge algılama için basit bir çözüm
 * Dynamsoft plugin yüklü ise kullanır, değilse fallback
 */
export function useDocumentNormalizer() {
  const [isReady, setIsReady] = useState(true); // Basit mod her zaman hazır
  const [lastDetection, setLastDetection] = useState<DocumentDetectionResult>({
    detected: false,
    confidence: 0,
    isCardShaped: false,
  });

  // Dynamsoft kullanılabilir mi kontrol et
  const isDynamsoftAvailable = useRef<boolean | null>(null);

  /**
   * Dynamsoft plugin'i kontrol et
   */
  const checkDynamsoftAvailability = useCallback(async () => {
    if (isDynamsoftAvailable.current !== null) {
      return isDynamsoftAvailable.current;
    }

    try {
      // Dynamsoft modülünü dinamik olarak import etmeyi dene
      const dynamsoft = await import('vision-camera-dynamsoft-document-normalizer');
      isDynamsoftAvailable.current = !!dynamsoft;
      return true;
    } catch {
      isDynamsoftAvailable.current = false;
      return false;
    }
  }, []);

  /**
   * Basit belge kenarı tahmini
   * Bu, OCR overlay'deki kart çerçevesini kullanır
   */
  const getDefaultCardBounds = useCallback((): [Point, Point, Point, Point] => {
    const cardWidth = SCREEN_WIDTH * 0.85;
    const cardHeight = cardWidth / CARD_ASPECT_RATIO;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT * 0.4;
    const left = centerX - cardWidth / 2;
    const top = centerY - cardHeight / 2;

    return [
      { x: left, y: top },                          // topLeft
      { x: left + cardWidth, y: top },              // topRight
      { x: left + cardWidth, y: top + cardHeight }, // bottomRight
      { x: left, y: top + cardHeight },             // bottomLeft
    ];
  }, []);

  /**
   * Frame'den belge algıla (Dynamsoft varsa kullan)
   */
  const detectDocument = useCallback(async (frame: any): Promise<DocumentDetectionResult> => {
    const hasDynamsoft = await checkDynamsoftAvailability();

    if (hasDynamsoft) {
      try {
        const { detect } = await import('vision-camera-dynamsoft-document-normalizer');
        const result = detect(frame);
        
        if (result && result.length > 0) {
          const doc = result[0];
          const detection: DocumentDetectionResult = {
            detected: true,
            corners: [
              { x: doc.points[0].x, y: doc.points[0].y },
              { x: doc.points[1].x, y: doc.points[1].y },
              { x: doc.points[2].x, y: doc.points[2].y },
              { x: doc.points[3].x, y: doc.points[3].y },
            ],
            confidence: doc.confidence || 0.8,
            isCardShaped: checkIsCardShaped(doc.points),
          };
          setLastDetection(detection);
          return detection;
        }
      } catch {
        // Dynamsoft detection failed - use fallback
      }
    }

    // Fallback: Belge algılanamadı, varsayılan çerçeve kullan
    const fallback: DocumentDetectionResult = {
      detected: false,
      corners: getDefaultCardBounds(),
      confidence: 0,
      isCardShaped: false,
    };
    setLastDetection(fallback);
    return fallback;
  }, [checkDynamsoftAvailability, getDefaultCardBounds]);

  /**
   * Belgeden görüntüyü normalleştir
   */
  const normalizeDocument = useCallback(async (
    imagePath: string,
    corners: [Point, Point, Point, Point]
  ): Promise<NormalizationResult> => {
    const hasDynamsoft = await checkDynamsoftAvailability();

    if (hasDynamsoft) {
      try {
        const { normalizeFile } = await import('vision-camera-dynamsoft-document-normalizer');
        const result = await normalizeFile(imagePath, {
          x1: corners[0].x, y1: corners[0].y,
          x2: corners[1].x, y2: corners[1].y,
          x3: corners[2].x, y3: corners[2].y,
          x4: corners[3].x, y4: corners[3].y,
        }, { saveNormalizationResultAsFile: true });

        if (result && result.imagePath) {
          return {
            success: true,
            normalizedPath: result.imagePath,
          };
        }
      } catch {
        // Dynamsoft normalization failed - use fallback
      }
    }

    // Fallback: Normalizasyon yapılamadı, orijinal görüntüyü kullan
    return {
      success: false,
      error: 'Belge normalleştirme kullanılamıyor',
    };
  }, [checkDynamsoftAvailability]);

  return {
    isReady,
    lastDetection,
    detectDocument,
    normalizeDocument,
    getDefaultCardBounds,
    isDynamsoftAvailable: isDynamsoftAvailable.current,
  };
}

/**
 * Algılanan şeklin kimlik kartı oranına yakın olup olmadığını kontrol et
 */
function checkIsCardShaped(points: Point[]): boolean {
  if (points.length !== 4) return false;

  // Genişlik ve yükseklik hesapla
  const width = Math.abs(points[1].x - points[0].x);
  const height = Math.abs(points[3].y - points[0].y);

  if (width === 0 || height === 0) return false;

  const ratio = width / height;
  
  // Kredi kartı oranı: 1.586 (±%20 tolerans)
  return ratio > 1.2 && ratio < 2.0;
}
