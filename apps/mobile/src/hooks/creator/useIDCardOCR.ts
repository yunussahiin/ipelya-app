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
  hasMRZ?: boolean; // MRZ satırları var mı (arka yüz göstergesi)
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

/**
 * MRZ var mı kontrol et (arka yüz tespiti için)
 */
function hasMRZPattern(text: string): boolean {
  // OCR hataları: « → <
  const cleanText = text.replace(/«/g, '<').replace(/\s+/g, '').toUpperCase();
  // MRZ pattern: IDTUR veya çoklu < karakterleri veya TUR + 11 haneli TC
  return /IDTUR/.test(cleanText) || 
         /<<</.test(cleanText) || 
         /TUR\d{10,11}/.test(cleanText) ||
         /[A-Z]+<<[A-Z]+/.test(cleanText);
}

function parseMRZ(text: string): MRZData | null {
  // OCR hataları: « → <, boşlukları temizle
  const cleanText = text
    .replace(/«/g, '<')  // OCR hatası: « → <
    .replace(/\s+/g, '')
    .toUpperCase();
  
  // MRZ Satır 2 pattern: YYMMDD + check + gender + YYMMDD + check + TUR + filler
  // Örnek: 9612291M2806033TUR<<<<<<<<<<0
  // TC numarası Line 1'de, Line 2'de sadece tarihler ve cinsiyet var
  const line2Regex = /(\d{2})(\d{2})(\d{2})\d\s*([MF])\s*(\d{2})(\d{2})(\d{2})\d\s*TUR/;
  const line2Match = line2Regex.exec(cleanText);
  
  // TC numarası için ayrı pattern - Line 1'de: I<TURA11N777024<26087149210<<<
  const tcFromLine1Regex = /[<«](\d{11})[<«]/;
  const tcMatch = tcFromLine1Regex.exec(cleanText);
  
  // MRZ Satır 3 pattern: SOYAD<<AD veya SOYAD<<AD<<IKINCIADI
  // OCR bazen Ş'yi OS, Ğ'yi G, İ'yi I olarak okur, « yerine < kullanabilir
  // En az 2 tane << olmalı (SOYAD<<AD formatı)
  const line3Regex = /([A-ZÇĞİÖŞÜ]{2,20})[<«]{2,}([A-ZÇĞİÖŞÜ]{2,20})(?:[<«]{2,}([A-ZÇĞİÖŞÜ]+))?[<«]*/;
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
    
    // Uyruk
    result.nationality = 'TC';
  }
  
  // TC Kimlik No - Line 1'den al
  if (tcMatch) {
    result.tcNumber = tcMatch[1];
  }
  
  if (line3Match) {
    // MRZ'den gelen isim/soyisim - artık regex daha spesifik
    result.lastName = line3Match[1];
    
    // Middle name varsa ve geçerli bir isimse ekle (K, KK, I gibi OCR hatalarını filtrele)
    const middleName = line3Match[3];
    const isValidMiddleName = middleName && 
      middleName.length >= 2 && 
      !/^[KIO]+$/.test(middleName); // Sadece K, I, O karakterlerinden oluşuyorsa geçersiz
    
    result.firstName = isValidMiddleName 
      ? `${line3Match[2]} ${middleName}`
      : line3Match[2];
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
 * TC Kimlik kartında: "Doğum Tarihi / Date of Birth" altında "29.12.1996" formatında
 */
function extractDate(text: string): string | undefined {
  // Önce MRZ'den dene (arka yüz)
  const mrzData = parseMRZ(text);
  if (mrzData?.birthDate) {
    return mrzData.birthDate;
  }

  // Ön yüzden: "Doğum Tarihi" veya "Date of Birth" etiketinden sonraki tarihi ara
  const birthDatePatterns = [
    // "Doğum Tarihi / Date of Birth" sonrası
    /(?:Do[gğ]um\s*Tarihi|Date\s*of\s*Birth)[^\d]*(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})/gi,
    // Sadece "Doğum" kelimesi sonrası
    /Do[gğ]um[^\d]*(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})/gi,
  ];

  for (const pattern of birthDatePatterns) {
    const match = pattern.exec(text);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Doğum tarihi validasyonu - 18 yaş ve üzeri, makul bir tarih
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2010) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // Fallback: Tüm tarihleri bul ve doğum tarihi olabilecekleri filtrele
  const dateRegex = /\b(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})\b/g;
  const dates: { date: string; year: number }[] = [];
  let match;
  
  while ((match = dateRegex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Geçerli tarih mi?
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      // Doğum tarihi olabilecek yıllar (1900-2010)
      if (year >= 1900 && year <= 2010) {
        dates.push({
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          year
        });
      }
    }
  }

  // En eski tarihi doğum tarihi olarak kabul et (geçerlilik tarihi daha yeni olacaktır)
  if (dates.length > 0) {
    dates.sort((a, b) => a.year - b.year);
    return dates[0].date;
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

  // Ön yüzden: Soyad ve Ad etiketlerini ara
  // OCR çıktısı: "Soyadı / Surname\nŞAHİN\nAdı Given Name(s)\nYUNUS"
  
  // Pattern: "Soyadı/ Surname" sonrası satır sonu ve büyük harfli isim (tek satır)
  const surnamePatterns = [
    /Soyad[ıi]\s*[\/\|]?\s*Surname\s*\n([A-ZÇĞİÖŞÜ]+)\n/i,
    /Surname\s*\n([A-ZÇĞİÖŞÜ]+)\n/i,
    /Soyad[ıi]\s*\n([A-ZÇĞİÖŞÜ]+)\n/i,
  ];
  
  // Pattern: "Adı/ Given Name(s)" sonrası satır sonu ve büyük harfli isim (tek satır, sonraki satıra kadar)
  const givenNamePatterns = [
    /Ad[ıi]\s*[\/\|]?\s*Given\s*Name\(?s?\)?\s*\n([A-ZÇĞİÖŞÜ]+(?:\s+[A-ZÇĞİÖŞÜ]+)?)\n/i,
    /Given\s*Name\(?s?\)?\s*\n([A-ZÇĞİÖŞÜ]+(?:\s+[A-ZÇĞİÖŞÜ]+)?)\n/i,
    /Ad[ıi]\s*\n([A-ZÇĞİÖŞÜ]+(?:\s+[A-ZÇĞİÖŞÜ]+)?)\n/i,
  ];
  
  let lastName: string | undefined;
  let firstName: string | undefined;
  
  // Soyad ara
  for (const pattern of surnamePatterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      lastName = match[1].toUpperCase();
      break;
    }
  }
  
  // Ad ara
  for (const pattern of givenNamePatterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      firstName = match[1].toUpperCase();
      break;
    }
  }
  
  if (lastName || firstName) {
    return { lastName, firstName };
  }

  // Fallback: TC kimlik kartında isimler büyük harfle yazılır
  const nameRegex = /\b[A-ZÇĞİÖŞÜ]{2,}\b/g;
  const matches = text.match(nameRegex);
  
  if (matches && matches.length >= 2) {
    // Belirli kelimeleri filtrele
    const excludeWords = [
      'TÜRKİYE', 'TURKEY', 'CUMHURİYETİ', 'CUMHURİYETI', 'CUMHURIYET', 'REPUBLIC', 'OF',
      'KİMLİK', 'KIMLIK', 'KARTI', 'CARD', 'IDENTITY', 'NÜFUS', 'LDENTITY', 'DENTITY',
      'DOĞUM', 'DOGUM', 'TARİHİ', 'TARIHI', 'DATE', 'BIRTH', 'YERİ', 'YERI', 'PLACE',
      'SOYADI', 'SURNAME', 'ADI', 'NAME', 'GIVEN', 'NAMES', 'SON',
      'SERİ', 'SERI', 'NO', 'SIRA', 'NUMARASI', 'TC', 'TCKN', 'TR',
      'GEÇERLİLİK', 'GECERLILIK', 'VALIDITY', 'VALID', 'UNTIL', 'GEÇERLILIK',
      'ANNE', 'BABA', 'MOTHER', 'FATHER',
      'IDTUR', 'TUR', 'BAKANLIGI', 'ICISLERI', 'VEREN', 'MAKAM',
      'CİNSİYET', 'CINSIYET', 'GENDER', 'UYRUK', 'NATIONALITY', 'UYRUGU',
      'LDENTITY', 'LDENTIEY', 'LDENTY', 'IDENTTY', 'KIMIIK', 'KIMIK', 'KIMI',
      'DOCUMENT', 'NUMBER', 'IMZA', 'SIGNATURE', 'IMZASI'
    ];
    
    const filteredNames = matches.filter(name => 
      !excludeWords.includes(name) && name.length >= 2
    );
    
    if (filteredNames.length >= 2) {
      // İlk iki ismi al (soyad genelde önce gelir)
      return {
        lastName: filteredNames[0],
        firstName: filteredNames.slice(1).join(' '),
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
    
    // Debug: Raw OCR text (her 30 frame'de bir logla)
    if (Math.random() < 0.03) {
      console.log('[OCR] Raw text sample:', text.substring(0, 300));
    }
    
    const tcNumber = extractTCNumber(text);
    const names = extractNames(text);
    const birthDate = extractDate(text);
    const expiryDate = extractExpiryDate(text);
    const gender = extractGender(text);
    const nationality = extractNationality(text);
    const documentNo = extractDocumentNo(text);
    const hasMRZ = hasMRZPattern(text);
    
    return {
      tcNumber,
      ...names,
      birthDate,
      expiryDate,
      gender,
      nationality,
      documentNo,
      hasMRZ,
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
      hasMRZ: {},
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

    // hasMRZ için çoğunluk kontrolü
    const mrzTrueCount = resultsHistory.current.filter(r => r.hasMRZ === true).length;
    const hasMRZ = mrzTrueCount > resultsHistory.current.length / 2;

    const consolidatedData: IDCardData = {
      tcNumber: getMostFrequent(counts.tcNumber),
      firstName: getMostFrequent(counts.firstName),
      lastName: getMostFrequent(counts.lastName),
      birthDate: getMostFrequent(counts.birthDate),
      expiryDate: getMostFrequent(counts.expiryDate),
      gender: getMostFrequent(counts.gender) as 'M' | 'F' | undefined,
      nationality: getMostFrequent(counts.nationality),
      documentNo: getMostFrequent(counts.documentNo),
      hasMRZ,
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
    
    // isComplete için sıkı kontrol:
    // - En az 3 temel alan bulunmalı
    // - Ad ve soyad en az 2 karakter olmalı (yanlış okumayı önlemek için)
    const validFirstName = consolidatedData.firstName && consolidatedData.firstName.length >= 2;
    const validLastName = consolidatedData.lastName && consolidatedData.lastName.length >= 2;
    const isComplete = fieldsFound >= 3 && validFirstName && validLastName;

    return {
      data: consolidatedData,
      confidence: Math.min(confidence, 1),
      isComplete,
    };
  }, []);

  /**
   * Frame işle - OCR sonucunu parse et ve state'i güncelle
   * @param ocrResult - { resultText: string } formatında OCR sonucu
   * @param logResults - true ise sonuçları logla (varsayılan: false)
   */
  const processFrame = useCallback((ocrResult: { resultText: string }, logResults = false): OCRResult => {
    const data = parseOCRResult(ocrResult);
    const result = consolidateResults(data);
    setLastResult(result);
    
    // İstenirse sonuçları logla
    if (logResults && result.isComplete) {
      console.log('[OCR] Taranan veriler:', {
        tcNumber: result.data.tcNumber || '-',
        firstName: result.data.firstName || '-',
        lastName: result.data.lastName || '-',
        birthDate: result.data.birthDate || '-',
        expiryDate: result.data.expiryDate || '-',
        gender: result.data.gender || '-',
        documentNo: result.data.documentNo || '-',
        hasMRZ: result.data.hasMRZ ? 'Evet (Arka yüz)' : 'Hayır (Ön yüz)',
        confidence: `${Math.round(result.confidence * 100)}%`,
      });
    }
    
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
