/**
 * useIDCardOCR Hook
 * KYC Kimlik kartı OCR okuma
 * 
 * Özellikler:
 * - TC Kimlik No çıkarma ve validasyon
 * - Ad/Soyad çıkarma
 * - Doğum tarihi çıkarma
 * - Güven skoru hesaplama
 * 
 * react-native-vision-camera-ocr-plus kullanır
 */

import { useCallback, useState, useRef } from 'react';
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';

export interface IDCardData {
  tcNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  rawText?: string;
}

export interface OCRResult {
  data: IDCardData;
  confidence: number; // 0-1 arası
  isComplete: boolean; // Tüm alanlar dolu mu
}

export interface OCRValidation {
  tcNumber: {
    valid: boolean;
    error?: string;
  };
  firstName: {
    valid: boolean;
    error?: string;
  };
  lastName: {
    valid: boolean;
    error?: string;
  };
}

/**
 * TC Kimlik No algoritması
 * - 11 hane
 * - İlk hane 0 olamaz
 * - İlk 10 hanenin toplamı mod 10 = 11. hane
 * - Tek sıradaki rakamların toplamı * 7 - çift sıradaki toplamı mod 10 = 10. hane
 */
function validateTCNumber(tc: string): boolean {
  if (!tc || tc.length !== 11) return false;
  if (tc[0] === '0') return false;
  if (!/^\d{11}$/.test(tc)) return false;

  const digits = tc.split('').map(Number);
  
  // 11. hane kontrolü
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;

  // 10. hane kontrolü
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  if (((oddSum * 7) - evenSum) % 10 !== digits[9]) {
    // Pozitif mod için
    if ((((oddSum * 7) - evenSum) % 10 + 10) % 10 !== digits[9]) {
      return false;
    }
  }

  return true;
}

/**
 * Metinden TC Kimlik No çıkar
 */
function extractTCNumber(text: string): string | undefined {
  // 11 haneli rakam gruplarını bul
  const tcRegex = /\b[1-9]\d{10}\b/g;
  const matches = text.match(tcRegex);
  
  if (matches) {
    // Algoritmik olarak geçerli olanı bul
    for (const match of matches) {
      if (validateTCNumber(match)) {
        return match;
      }
    }
  }
  return undefined;
}

/**
 * Metinden tarih çıkar (GG.AA.YYYY veya GG/AA/YYYY formatı)
 */
function extractDate(text: string): string | undefined {
  // GG.AA.YYYY veya GG/AA/YYYY
  const dateRegex = /\b(\d{2})[\.\/](\d{2})[\.\/](\d{4})\b/g;
  const match = dateRegex.exec(text);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Basit tarih validasyonu
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2010) {
      return `${match[3]}-${match[2]}-${match[1]}`; // ISO format
    }
  }
  return undefined;
}

/**
 * Metinden isim çıkar (büyük harfli Türkçe kelimeler)
 */
function extractNames(text: string): { firstName?: string; lastName?: string } {
  // TC kimlik kartında isimler büyük harfle yazılır
  // Türkçe karakterler dahil
  const nameRegex = /\b[A-ZÇĞİÖŞÜ]{2,}\b/g;
  const matches = text.match(nameRegex);
  
  if (matches && matches.length >= 2) {
    // Belirli kelimeleri filtrele (TÜRKİYE, CUMHURİYETİ, KİMLİK, vb.)
    const excludeWords = [
      'TÜRKİYE', 'TURKEY', 'CUMHURİYETİ', 'REPUBLIC',
      'KİMLİK', 'KARTI', 'CARD', 'IDENTITY', 'NÜFUS',
      'DOĞUM', 'TARİHİ', 'DATE', 'BIRTH', 'YERİ', 'PLACE',
      'SOYADI', 'SURNAME', 'ADI', 'NAME', 'GIVEN',
      'SERİ', 'NO', 'SIRA', 'NUMARASI', 'TC', 'TCKN',
      'GEÇERLİLİK', 'VALIDITY', 'ANNE', 'BABA', 'MOTHER', 'FATHER'
    ];
    
    const filteredNames = matches.filter(name => 
      !excludeWords.includes(name) && name.length >= 2
    );
    
    if (filteredNames.length >= 2) {
      // Genellikle soyad önce, ad sonra gelir
      // Ama emin olamayız, en uzun iki kelimeyi alalım
      const sorted = filteredNames.sort((a, b) => b.length - a.length);
      return {
        lastName: sorted[0],
        firstName: sorted[1],
      };
    } else if (filteredNames.length === 1) {
      return { firstName: filteredNames[0] };
    }
  }
  
  return {};
}

export function useIDCardOCR() {
  let scanText: any;
  
  try {
    const textRecognition = useTextRecognition({ language: 'latin' });
    scanText = textRecognition.scanText;
    console.log('[OCR] useTextRecognition initialized successfully');
  } catch (error) {
    console.error('[OCR] useTextRecognition failed:', error);
    scanText = () => ({ resultText: '' });
  }
  
  const [lastResult, setLastResult] = useState<OCRResult>({
    data: {},
    confidence: 0,
    isComplete: false,
  });

  // Birden fazla frame'den gelen sonuçları birleştirmek için
  const resultsHistory = useRef<IDCardData[]>([]);
  const HISTORY_SIZE = 5;

  /**
   * OCR sonucunu parse et
   */
  const parseOCRResult = useCallback((ocrResult: any): IDCardData => {
    const text = ocrResult?.resultText || '';
    
    if (text && text.length > 10) {
      console.log('[OCR] Raw text detected:', text.substring(0, 200));
    }
    
    const tcNumber = extractTCNumber(text);
    const names = extractNames(text);
    const birthDate = extractDate(text);
    
    if (tcNumber || names.firstName || names.lastName || birthDate) {
      console.log('[OCR] Extracted data:', { tcNumber, ...names, birthDate });
    }
    
    return {
      tcNumber,
      ...names,
      birthDate,
      rawText: text,
    };
  }, []);

  /**
   * Sonuçları birleştir ve güven skoru hesapla
   */
  const consolidateResults = useCallback((data: IDCardData): OCRResult => {
    // History'e ekle
    resultsHistory.current.push(data);
    if (resultsHistory.current.length > HISTORY_SIZE) {
      resultsHistory.current.shift();
    }

    // En sık görülen değerleri bul
    const tcCounts: Record<string, number> = {};
    const firstNameCounts: Record<string, number> = {};
    const lastNameCounts: Record<string, number> = {};
    const birthDateCounts: Record<string, number> = {};

    for (const result of resultsHistory.current) {
      if (result.tcNumber) {
        tcCounts[result.tcNumber] = (tcCounts[result.tcNumber] || 0) + 1;
      }
      if (result.firstName) {
        firstNameCounts[result.firstName] = (firstNameCounts[result.firstName] || 0) + 1;
      }
      if (result.lastName) {
        lastNameCounts[result.lastName] = (lastNameCounts[result.lastName] || 0) + 1;
      }
      if (result.birthDate) {
        birthDateCounts[result.birthDate] = (birthDateCounts[result.birthDate] || 0) + 1;
      }
    }

    // En sık görülenleri al
    const getMostFrequent = (counts: Record<string, number>): string | undefined => {
      let maxCount = 0;
      let mostFrequent: string | undefined;
      for (const [value, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequent = value;
        }
      }
      return mostFrequent;
    };

    const consolidatedData: IDCardData = {
      tcNumber: getMostFrequent(tcCounts),
      firstName: getMostFrequent(firstNameCounts),
      lastName: getMostFrequent(lastNameCounts),
      birthDate: getMostFrequent(birthDateCounts),
    };

    // Güven skoru hesapla
    let fieldsFound = 0;
    if (consolidatedData.tcNumber) fieldsFound++;
    if (consolidatedData.firstName) fieldsFound++;
    if (consolidatedData.lastName) fieldsFound++;
    if (consolidatedData.birthDate) fieldsFound++;

    const confidence = fieldsFound / 4;
    const isComplete = fieldsFound >= 3; // En az 3 alan bulunmalı

    if (isComplete) {
      console.log('[OCR] Complete result:', { consolidatedData, confidence, fieldsFound });
    }

    return {
      data: consolidatedData,
      confidence,
      isComplete,
    };
  }, []);

  /**
   * Frame işle
   */
  const processFrame = useCallback((frame: any): OCRResult => {
    const ocrResult = scanText(frame);
    const data = parseOCRResult(ocrResult);
    const result = consolidateResults(data);
    setLastResult(result);
    return result;
  }, [scanText, parseOCRResult, consolidateResults]);

  /**
   * Form verileriyle karşılaştır
   */
  const validateAgainstForm = useCallback((
    ocrData: IDCardData,
    formData: { firstName?: string; lastName?: string; birthDate?: string; idNumber?: string }
  ): OCRValidation => {
    const normalize = (str?: string) => str?.toLowerCase().trim() || '';

    return {
      tcNumber: {
        valid: !ocrData.tcNumber || !formData.idNumber || 
               ocrData.tcNumber === formData.idNumber,
        error: ocrData.tcNumber && formData.idNumber && ocrData.tcNumber !== formData.idNumber
          ? 'TC Kimlik numarası eşleşmiyor'
          : undefined,
      },
      firstName: {
        valid: !ocrData.firstName || !formData.firstName ||
               normalize(ocrData.firstName) === normalize(formData.firstName),
        error: ocrData.firstName && formData.firstName && 
               normalize(ocrData.firstName) !== normalize(formData.firstName)
          ? 'Ad eşleşmiyor'
          : undefined,
      },
      lastName: {
        valid: !ocrData.lastName || !formData.lastName ||
               normalize(ocrData.lastName) === normalize(formData.lastName),
        error: ocrData.lastName && formData.lastName && 
               normalize(ocrData.lastName) !== normalize(formData.lastName)
          ? 'Soyad eşleşmiyor'
          : undefined,
      },
    };
  }, []);

  /**
   * History'i temizle
   */
  const resetHistory = useCallback(() => {
    resultsHistory.current = [];
    setLastResult({
      data: {},
      confidence: 0,
      isComplete: false,
    });
  }, []);

  return {
    scanText,
    processFrame,
    parseOCRResult,
    validateAgainstForm,
    validateTCNumber,
    lastResult,
    resetHistory,
  };
}

export { validateTCNumber };
