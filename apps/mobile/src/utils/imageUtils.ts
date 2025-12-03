/**
 * Image Utilities
 * Skia ile fotoğraf işleme
 */

import { Skia, matchFont, ImageFormat } from "@shopify/react-native-skia";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

/**
 * Fotoğrafa tarih damgası ekle
 */
export async function addTimestampToImage(
  imageUri: string,
  timestamp: Date
): Promise<string> {
  try {
    console.log("[ImageUtils] Starting timestamp addition for:", imageUri);
    
    // Fotoğrafı yükle - yeni File API
    const sourceFile = new File(imageUri);
    const imageData = await sourceFile.base64();
    
    const skData = Skia.Data.fromBase64(imageData);
    const image = Skia.Image.MakeImageFromEncoded(skData);
    
    if (!image) {
      console.warn("[ImageUtils] Failed to decode image, returning original");
      return imageUri;
    }

    const width = image.width();
    const height = image.height();
    console.log("[ImageUtils] Image dimensions:", width, "x", height);

    // Offscreen surface oluştur
    const surface = Skia.Surface.MakeOffscreen(width, height);
    if (!surface) {
      console.warn("[ImageUtils] Failed to create offscreen surface, returning original");
      return imageUri;
    }

    const canvas = surface.getCanvas();

    // Orijinal fotoğrafı çiz
    canvas.drawImage(image, 0, 0);

    // Tarih damgası metni
    const dateStr = timestamp.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = timestamp.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timestampText = `${dateStr} ${timeStr}`;

    // Font ve paint ayarları
    const fontSize = Math.max(32, Math.floor(width / 25));
    const fontFamily = Platform.select({ ios: "Helvetica", default: "sans-serif" });
    const fontStyle = {
      fontFamily,
      fontSize,
      fontWeight: "500",
    } as const;
    const font = matchFont(fontStyle);
    if (!font) {
      console.warn("[ImageUtils] Failed to match font, skipping timestamp");
      return imageUri;
    }
    
    // TextBlob oluştur
    const textBlob = Skia.TextBlob.MakeFromText(timestampText, font);
    if (!textBlob) {
      console.warn("[ImageUtils] Failed to create text blob, returning original");
      return imageUri;
    }

    const measured = font.measureText(timestampText);
    const textWidth = measured.width;
    const textHeight = fontSize;

    // Pozisyon - sağ alt köşe
    const padding = 20;
    const bgPadding = 12;
    const x = width - textWidth - padding - bgPadding;
    const y = height - padding - bgPadding;

    // Arka plan için paint
    const bgPaint = Skia.Paint();
    bgPaint.setColor(Skia.Color("rgba(0, 0, 0, 0.7)"));

    // Arka plan dikdörtgeni
    const bgRect = Skia.XYWHRect(
      x - bgPadding,
      y - textHeight - bgPadding,
      textWidth + bgPadding * 2,
      textHeight + bgPadding * 2
    );
    const rrect = Skia.RRectXY(bgRect, 8, 8);
    canvas.drawRRect(rrect, bgPaint);

    // Metin için paint
    const textPaint = Skia.Paint();
    textPaint.setColor(Skia.Color("white"));

    // TextBlob'u çiz
    canvas.drawTextBlob(textBlob, x, y, textPaint);

    // Surface'ı flush et ve image'a çevir
    surface.flush();
    const resultImage = surface.makeImageSnapshot();
    if (!resultImage) {
      console.warn("[ImageUtils] Failed to create snapshot, returning original");
      return imageUri;
    }

    // JPEG olarak encode et (quality: 80 - dosya boyutu optimizasyonu)
    const resultData = resultImage.encodeToBytes(ImageFormat.JPEG, 80);
    if (!resultData) {
      console.warn("[ImageUtils] Failed to encode image, returning original");
      return imageUri;
    }

    // Yeni dosyaya kaydet - yeni File API
    const outputFile = new File(Paths.cache, `timestamped_${Date.now()}.jpg`);
    outputFile.create();
    
    // Uint8Array olarak yaz
    const bytes = new Uint8Array(resultData);
    outputFile.write(bytes);
    
    const outputUri = outputFile.uri;

    console.log("[ImageUtils] Timestamp added successfully:", outputUri);
    return outputUri;
  } catch (error) {
    console.error("[ImageUtils] Error adding timestamp:", error);
    return imageUri;
  }
}

/**
 * Base64'ü dosyaya kaydet
 */
export async function saveBase64ToFile(
  base64: string,
  filename: string
): Promise<string> {
  // Base64'ü Uint8Array'e çevir
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const outputFile = new File(Paths.cache, filename);
  outputFile.create();
  outputFile.write(bytes);
  return outputFile.uri;
}
