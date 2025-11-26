/**
 * Broadcast Index - Kanal Listesi
 *
 * Amaç: Tüm yayın kanallarını listele
 * Tarih: 2025-11-26
 *
 * Bu sayfa genellikle doğrudan açılmaz,
 * kullanıcılar mesajlar sekmesinden veya
 * creator profilinden kanallara erişir.
 */

import { BroadcastChannelListScreen } from "@/components/broadcast";

export default function BroadcastIndexPage() {
  return <BroadcastChannelListScreen />;
}
