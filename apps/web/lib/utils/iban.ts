/**
 * IBAN Validation Utilities
 * Türkiye IBAN formatı ve Mod97 checksum kontrolü
 */

export interface IBANValidationResult {
  valid: boolean;
  error?: string;
  formatted?: string;
  bankCode?: string;
}

/**
 * Türk IBAN'ını doğrular (format + Mod97 checksum)
 * TR + 2 check digit + 5 banka kodu + 17 hesap no = 26 karakter
 */
export function validateTurkishIBAN(iban: string): IBANValidationResult {
  // Temizle ve büyük harfe çevir
  const clean = iban.replace(/\s/g, "").toUpperCase();

  // Uzunluk kontrolü
  if (clean.length !== 26) {
    return { valid: false, error: "IBAN 26 karakter olmalıdır" };
  }

  // Format kontrolü: TR + 24 rakam
  if (!/^TR[0-9]{24}$/.test(clean)) {
    return { valid: false, error: "Geçersiz IBAN formatı (TR + 24 rakam olmalı)" };
  }

  // Mod97 checksum kontrolü
  // 1. İlk 4 karakteri sona taşı
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // 2. Harfleri sayılara çevir (A=10, B=11, ... Z=35)
  let numericIban = "";
  for (const char of rearranged) {
    if (char >= "A" && char <= "Z") {
      numericIban += (char.charCodeAt(0) - 55).toString();
    } else {
      numericIban += char;
    }
  }

  // 3. Mod 97 hesapla (büyük sayı için parçalı hesaplama)
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i += 7) {
    const chunk = remainder.toString() + numericIban.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  // 4. Sonuç 1 olmalı
  if (remainder !== 1) {
    return { valid: false, error: "IBAN kontrol basamağı hatalı" };
  }

  // Banka kodu çıkar (5-9. karakterler)
  const bankCode = clean.slice(4, 9);

  // Formatlı IBAN oluştur
  const formatted = clean.replace(/(.{4})/g, "$1 ").trim();

  return {
    valid: true,
    formatted,
    bankCode
  };
}

/**
 * Banka kodu bilgilerini döndürür
 */
export function getBankName(bankCode: string): string {
  const banks: Record<string, string> = {
    "00010": "T.C. Ziraat Bankası",
    "00012": "Türkiye Halk Bankası",
    "00015": "Türkiye Vakıflar Bankası",
    "00032": "Türkiye İş Bankası",
    "00046": "Akbank",
    "00059": "Şekerbank",
    "00062": "Garanti BBVA",
    "00064": "Türkiye İhracat Kredi Bankası",
    "00067": "Yapı ve Kredi Bankası",
    "00099": "ING Bank",
    "00103": "Fibabanka",
    "00111": "QNB Finansbank",
    "00123": "HSBC",
    "00124": "Alternatifbank",
    "00134": "Denizbank",
    "00135": "Anadolubank",
    "00146": "Odea Bank",
    "00203": "Albaraka Türk",
    "00205": "Kuveyt Türk",
    "00206": "Türkiye Finans",
    "00209": "Ziraat Katılım",
    "00210": "Vakıf Katılım",
    "00011": "Emlak Katılım",
    "00143": "Aktif Bank",
    "00092": "Citibank",
    "00100": "Adabank",
    "00109": "Tekstil Bankası",
    "00115": "Deutsche Bank",
    "00116": "Pasha Bank",
    "00121": "Turkland Bank",
    "00129": "Merrill Lynch"
  };

  return banks[bankCode] || "Bilinmeyen Banka";
}

/**
 * IBAN'ı güvenli şekilde maskeler
 * TR12 3456 7890 **** **** **** 1234
 */
export function maskIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  if (clean.length !== 26) return iban;

  const start = clean.slice(0, 12);
  const end = clean.slice(-4);
  const masked = start + " **** **** **** " + end;

  return masked;
}
