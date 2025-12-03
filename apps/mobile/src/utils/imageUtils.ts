/**
 * Image Utilities
 * Skia ile fotoğraf işleme
 */

import { Skia, SkImage } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system";

/**
 * Fotoğrafa tarih damgası ekle
 */
export async function addTimestampToImage(
  imageUri: string,
  timestamp: Date
): Promise<string> {
  try {
    // Fotoğrafı yükle
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const skData = Skia.Data.fromBase64(imageData);
    const image = Skia.Image.MakeImageFromEncoded(skData);
    
    if (!image) {
      console.warn("[ImageUtils] Failed to decode image, returning original");
      return imageUri;
    }

    const width = image.width();
    const height = image.height();

    // Offscreen surface oluştur
    const surface = Skia.Surface.Make(width, height);
    if (!surface) {
      console.warn("[ImageUtils] Failed to create surface, returning original");
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
    const fontSize = Math.max(24, Math.floor(width / 30));
    const font = Skia.Font(null, fontSize);
    const textWidth = font.measureText(timestampText).width;

    // Arka plan için paint
    const bgPaint = Skia.Paint();
    bgPaint.setColor(Skia.Color("rgba(0, 0, 0, 0.7)"));

    // Metin için paint
    const textPaint = Skia.Paint();
    textPaint.setColor(Skia.Color("white"));

    // Pozisyon - sağ alt köşe
    const padding = 16;
    const bgPadding = 8;
    const x = width - textWidth - padding - bgPadding * 2;
    const y = height - padding - bgPadding;

    // Arka plan dikdörtgeni
    const bgRect = Skia.XYWHRect(
      x - bgPadding,
      y - fontSize - bgPadding,
      textWidth + bgPadding * 2,
      fontSize + bgPadding * 2
    );
    canvas.drawRRect(
      Skia.RRectXY(bgRect, 8, 8),
      bgPaint
    );

    // Metni çiz
    canvas.drawText(timestampText, x, y, textPaint, font);

    // Surface'ı image'a çevir
    const resultImage = surface.makeImageSnapshot();
    if (!resultImage) {
      console.warn("[ImageUtils] Failed to create snapshot, returning original");
      return imageUri;
    }

    // JPEG olarak encode et
    const resultData = resultImage.encodeToBytes();
    if (!resultData) {
      console.warn("[ImageUtils] Failed to encode image, returning original");
      return imageUri;
    }

    // Yeni dosyaya kaydet - Uint8Array'i base64'e çevir
    const outputUri = `${FileSystem.cacheDirectory}timestamped_${Date.now()}.jpg`;
    
    // Uint8Array'i base64 string'e çevir
    let binary = "";
    const bytes = new Uint8Array(resultData);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Result = btoa(binary);
    
    await FileSystem.writeAsStringAsync(outputUri, base64Result, {
      encoding: FileSystem.EncodingType.Base64,
    });

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
  const outputUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(outputUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return outputUri;
}
