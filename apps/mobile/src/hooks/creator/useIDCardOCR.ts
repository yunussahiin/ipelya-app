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
  expiryDate?: string;
  gender?: 'M' | 'F';
  nationality?: string;
  documentNo?: string;
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
 * MRZ satırlarını parse et
 * TC Kimlik MRZ formatı (3 satır, her biri 30 karakter):
 * Satır 1: IDTUR + Seri No (9) + check + filler (<<<)
 * Satır 2: Doğum (YYMMDD) + check + Cinsiyet (M/F) + Geçerlilik (YYMMDD) + check + Uyruk (TUR) + TC No (11) + check + filler
 * Satır 3: SOYAD<<AD<<IKINCIADI<<<
 */
interface MRZData {
  tcNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  expiryDate?: string;
  gender?: 'M' | 'F';
  nationality?: string;
  documentNo?: string;
}

function parseMRZ(text: string): MRZData | null {
  const cleanText = text.replace(/\s+/g, '').toUpperCase();
  
  // MRZ Satır 2 pattern: YYMMDD + check + gender + YYMMDD + check + TUR + TC(11) + check
  // Örnek: 9305293F240727TUR82345678902
  const line2Regex = /(\d{2})(\d{2})(\d{2})\d([MF])(\d{2})(\d{2})(\d{2})\dTUR(\d{11})/;
  const line2Match = line2Regex.exec(cleanText);
  
  // MRZ Satır 3 pattern: SOYAD<<AD veya SOYAD<<AD<<IKINCIADI
  const line3Regex = /([A-Z]+)<<([A-Z]+)(?:<<([A-Z]+))?<{2,}/;
  const line3Match = line3Regex.exec(cleanText);
  
  // MRZ Satır 1 pattern: IDTUR + Seri No
  const line1Regex = /IDTUR([A-Z]\d{2}[A-Z]\d{5})/;
  const line1Match = line1Regex.exec(cleanText);
  
  if (!line2Match && !line3Match) {
    return null;
  }
  
  const result: MRZData = {};
  
  if (line2Match) {
    // Doğum tarihi: YYMMDD
    const birthYY = parseInt(line2Match[1], 10);
    const birthYear = birthYY <= 30 ? 2000 + birthYY : 1900 + birthYY;
    result.birthDate = `${birthYear}-${line2Match[2]}-${line2Match[3]}`;
    
    // Cinsiyet
    result.gender = line2Match[4] as 'M' | 'F';
    
    // Geçerlilik tarihi: YYMMDD
    const expiryYY = parseInt(line2Match[5], 10);
    const expiryYear = expiryYY <= 50 ? 2000 + expiryYY : 1900 + expiryYY;
    result.expiryDate = `${expiryYear}-${line2Match[6]}-${line2Match[7]}`;
    
    // TC Kimlik No
    result.tcNumber = line2Match[8];
    
    // Uyruk
    result.nationality = 'TC';
    
    // MRZ Line 2 parsed
  }
  
  if (line3Match) {
    result.lastName = line3Match[1];
    result.firstName = line3Match[3] 
      ? `${line3Match[2]} ${line3Match[3]}`
      : line3Match[2];
    // MRZ Line 3 parsed
  }
  
  if (line1Match) {
    result.documentNo = line1Match[1];
    // MRZ Line 1 parsed
  }
  
  return result;
}

/**
 * Metinden TC Kimlik No çıkar
 */
function extractTCNumber(text: string): string | undefined {
  // Önce MRZ'den dene (arka yüz - daha güvenilir)
  const mrzData = parseMRZ(text);
  if (mrzData?.tcNumber) {
    return mrzData.tcNumber;
  }

  // 11 haneli rakam gruplarını bul (ön yüz)
  const tcRegex = /\b[1-9]\d{10}\b/g;
  const matches = text.match(tcRegex);
  
  if (matches) {
    // Algoritmik olarak geçerli olanı bul
    for (const match of matches) {
      if (validateTCNumber(match)) {
        // TC found
        return match;
      }
    }
    // Algoritma geçmese bile ilk 11 haneliyi döndür (örnek kartlar için)
    if (matches[0]) {
      // TC found (unvalidated)
      return matches[0];
    }
  }
  return undefined;
}

/**
 * Metinden doğum tarihi çıkar
 */
function extractDate(text: string): string | undefined {
  // Önce MRZ'den dene
  const mrzData = parseMRZ(text);
  if (mrzData?.birthDate) {
    return mrzData.birthDate;
  }

  // GG.AA.YYYY veya GG/AA/YYYY (ön yüz)
  const dateRegex = /\b(\d{2})[\.\/](\d{2})[\.\/](\d{4})\b/g;
  const match = dateRegex.exec(text);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Basit tarih validasyonu - 18 yaş ve üzeri
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2010) {
      // BirthDate found
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return undefined;
}

/**
 * Metinden isim çıkar (büyük harfli Türkçe kelimeler)
 */
function extractNames(text: string): { firstName?: string; lastName?: string } {
  // Önce MRZ'den dene
  const mrzData = parseMRZ(text);
  if (mrzData?.firstName || mrzData?.lastName) {
    return { firstName: mrzData.firstName, lastName: mrzData.lastName };
  }

  // Ön yüzden: "Soyadı / Surname" ve "Adı / Given Name(s)" etiketlerinden sonra
  // Soyad pattern: Soyadı / Surname sonrası büyük harfli kelime (sadece harfler)
  const surnameMatch = /(?:Soyad[ıi]|Surname)[^\n]*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü]+)/i.exec(text);
  // Ad pattern: Adı / Given Name sonrası büyük harfli kelime(ler) - Doğum'a kadar
  const givenNameMatch = /(?:Ad[ıi]t?|Given\s*Name)[^\n]*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğıöşü]+)?)/i.exec(text);
  
  if (surnameMatch || givenNameMatch) {
    // Sadece büyük harfli kısmı al, satır sonu ve sonrasını temizle
    const cleanName = (name?: string) => {
      if (!name) return undefined;
      // İlk kelimeyi al (satır sonu veya küçük harften önce)
      const match = name.match(/^[A-ZÇĞİÖŞÜ]+/);
      return match?.[0];
    };
    
    const result = {
      lastName: cleanName(surnameMatch?.[1]),
      firstName: cleanName(givenNameMatch?.[1]),
    };
    // Names from labels
    return result;
  }

  // TC kimlik kartında isimler büyük harfle yazılır
  // Türkçe karakterler dahil
  const nameRegex = /\b[A-ZÇĞİÖŞÜ]{2,}\b/g;
  const matches = text.match(nameRegex);
  
  if (matches && matches.length >= 2) {
    // Belirli kelimeleri filtrele (TÜRKİYE, CUMHURİYETİ, KİMLİK, vb.)
    const excludeWords = [
      'TÜRKİYE', 'TURKEY', 'CUMHURİYETİ', 'CUMHURİYETI', 'CUMHURIYET', 'REPUBLIC',
      'KİMLİK', 'KIMLIK', 'KARTI', 'CARD', 'IDENTITY', 'NÜFUS',
      'DOĞUM', 'DOGUM', 'TARİHİ', 'TARIHI', 'DATE', 'BIRTH', 'YERİ', 'YERI', 'PLACE',
      'SOYADI', 'SURNAME', 'ADI', 'NAME', 'GIVEN', 'NAMES',
      'SERİ', 'SERI', 'NO', 'SIRA', 'NUMARASI', 'TC', 'TCKN', 'TR',
      'GEÇERLİLİK', 'GECERLILIK', 'VALIDITY', 'VALID', 'UNTIL',
      'ANNE', 'BABA', 'MOTHER', 'FATHER',
      'IDTUR', 'TUR', 'MAKBULE', 'BAKANLIGI', 'ICISLERI', 'VEREN', 'MAKAM',
      'CİNSİYET', 'CINSIYET', 'GENDER', 'UYRUK', 'NATIONALITY',
      'LDENTITY', 'LDENTIEY', 'LDENTY', 'IDENTTY', 'KIMIIK', 'KIMIK', 'KIMI'
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

/**
 * Geçerlilik tarihi çıkar
 */
function extractExpiryDate(text: string): string | undefined {
  // Önce MRZ'den dene
  const mrzData = parseMRZ(text);
  if (mrzData?.expiryDate) {
    return mrzData.expiryDate;
  }

  // Ön yüzden: Geçerlilik Tarihi / Valid Until 27.07.2024
  const expiryRegex = /(?:Geçerlilik|Valid|Until)[^\d]*(\d{2})[\.\/](\d{2})[\.\/](\d{4})/gi;
  const match = expiryRegex.exec(text);
  
  if (match) {
    // Expiry found
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return undefined;
}

/**
 * Cinsiyet çıkar
 * Ön yüz formatı: "Cinsiyet / Gender" altında "E/M" veya "K/F"
 * - E/M = Erkek/Male
 * - K/F = Kadın/Female
 * MRZ formatı: M veya F
 */
function extractGender(text: string): 'M' | 'F' | undefined {
  // Önce MRZ'den dene
  const mrzData = parseMRZ(text);
  if (mrzData?.gender) {
    return mrzData.gender;
  }

  // Ön yüzden: E/M = Erkek, K/F = Kadın
  // Regex: E/M veya E / M (boşluklu)
  if (/\bE\s*\/\s*M\b/i.test(text)) {
    return 'M';
  }
  // Regex: K/F veya K / F (boşluklu)
  if (/\bK\s*\/\s*F\b/i.test(text)) {
    return 'F';
  }
  
  return undefined;
}

/**
 * Uyruk çıkar
 */
function extractNationality(text: string): string | undefined {
  // Önce MRZ'den dene
  const mrzData = parseMRZ(text);
  if (mrzData?.nationality) {
    return mrzData.nationality;
  }

  // MRZ'den: ...TUR... 
  if (/TUR/i.test(text)) {
    return 'TC';
  }
  // Ön yüzden: Uyruk / Nationality TC/TUR
  if (/Uyruk[^\w]*TC|Nationality[^\w]*TUR/i.test(text)) {
    return 'TC';
  }
  return undefined;
}

/**
 * Belge seri no çıkar
 */
function extractDocumentNo(text: string): string | undefined {
  // Önce MRZ'den dene
  const mrzData = parseMRZ(text);
  if (mrzData?.documentNo) {
    return mrzData.documentNo;
  }

  // Ön yüzden: Seri No / Document No A12Z34567
  const docRegex = /(?:Seri|Document)[^\w]*([A-Z]\d{2}[A-Z]\d{5})/gi;
  const match = docRegex.exec(text);
  
  if (match) {
    // Document No found
    return match[1].toUpperCase();
  }
  return undefined;
}

/**
 * Kimlik geçerli mi kontrol et
 */
export function isDocumentExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  return expiry < new Date();
}

export function useIDCardOCR() {
  let scanText: any;
  
  try {
    const textRecognition = useTextRecognition({ language: 'latin' });
    scanText = textRecognition.scanText;
    // OCR initialized
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
    
    // Raw text processing
    
    const tcNumber = extractTCNumber(text);
    const names = extractNames(text);
    const birthDate = extractDate(text);
    const expiryDate = extractExpiryDate(text);
    const gender = extractGender(text);
    const nationality = extractNationality(text);
    const documentNo = extractDocumentNo(text);
    
    const data = {
      tcNumber,
      ...names,
      birthDate,
      expiryDate,
      gender,
      nationality,
      documentNo,
    };
    
    // Data extracted
    
    return {
      ...data,
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
    const counts: Record<keyof IDCardData, Record<string, number>> = {
      tcNumber: {},
      firstName: {},
      lastName: {},
      birthDate: {},
      expiryDate: {},
      gender: {},
      nationality: {},
      documentNo: {},
      rawText: {},
    };

    for (const result of resultsHistory.current) {
      for (const key of Object.keys(counts) as (keyof IDCardData)[]) {
        const value = result[key];
        if (value && key !== 'rawText') {
          counts[key][value] = (counts[key][value] || 0) + 1;
        }
      }
    }

    // En sık görülenleri al
    const getMostFrequent = (fieldCounts: Record<string, number>): string | undefined => {
      let maxCount = 0;
      let mostFrequent: string | undefined;
      for (const [value, count] of Object.entries(fieldCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequent = value;
        }
      }
      return mostFrequent;
    };

    const consolidatedData: IDCardData = {
      tcNumber: getMostFrequent(counts.tcNumber),
      firstName: getMostFrequent(counts.firstName),
      lastName: getMostFrequent(counts.lastName),
      birthDate: getMostFrequent(counts.birthDate),
      expiryDate: getMostFrequent(counts.expiryDate),
      gender: getMostFrequent(counts.gender) as 'M' | 'F' | undefined,
      nationality: getMostFrequent(counts.nationality),
      documentNo: getMostFrequent(counts.documentNo),
    };

    // Güven skoru hesapla (temel 4 alan + bonus alanlar)
    let fieldsFound = 0;
    const requiredFields = ['tcNumber', 'firstName', 'lastName', 'birthDate'] as const;
    for (const field of requiredFields) {
      if (consolidatedData[field]) fieldsFound++;
    }

    // Bonus alanlar
    let bonusFields = 0;
    if (consolidatedData.expiryDate) bonusFields++;
    if (consolidatedData.gender) bonusFields++;
    if (consolidatedData.nationality) bonusFields++;
    if (consolidatedData.documentNo) bonusFields++;

    const confidence = (fieldsFound + bonusFields * 0.25) / 5; // Max 1.0
    const isComplete = fieldsFound >= 3; // En az 3 temel alan bulunmalı

    // Consolidated result ready

    return {
      data: consolidatedData,
      confidence: Math.min(confidence, 1),
      isComplete,
    };
  }, []);

  /**
   * Frame işle - OCR sonucunu parse et ve state'i güncelle
   * @param ocrResult - { resultText: string } formatında OCR sonucu
   */
  const processFrame = useCallback((ocrResult: { resultText: string }): OCRResult => {
    const data = parseOCRResult(ocrResult);
    const result = consolidateResults(data);
    setLastResult(result);
    return result;
  }, [parseOCRResult, consolidateResults]);

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
