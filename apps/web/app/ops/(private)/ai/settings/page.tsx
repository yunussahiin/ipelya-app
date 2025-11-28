/**
 * AI Settings Page
 * Web Ops AI ayarları yönetim sayfası
 *
 * - Kredi durumu
 * - Model listesi ve özellikleri
 * - Model seçimi
 * - System prompt ayarları
 */

import { Metadata } from "next";
import { AISettingsClient } from "./client";

export const metadata: Metadata = {
  title: "AI Ayarları | İpelya Ops",
  description: "AI model ve sistem ayarları"
};

export default function AISettingsPage() {
  return <AISettingsClient />;
}
