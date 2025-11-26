/**
 * Date Utilities
 *
 * Amaç: Tarih formatlama yardımcı fonksiyonları
 * Tarih: 2025-11-26
 */

/**
 * Mesaj zamanını formatlar
 * - Bugün: "14:30"
 * - Dün: "Dün"
 * - Bu hafta: "Pazartesi"
 * - Daha eski: "12 Oca"
 */
export function formatMessageTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();

  // Bugün mü?
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // Dün mü?
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return "Dün";
  }

  // Bu hafta mı?
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) {
    return formatDayName(date);
  }

  // Daha eski
  return formatShortDate(date);
}

/**
 * Son görülme zamanını formatlar
 * - Şimdi: "çevrimiçi"
 * - 1-59 dakika: "X dk önce"
 * - 1-23 saat: "X saat önce"
 * - Dün: "dün görüldü"
 * - Daha eski: "12 Oca görüldü"
 */
export function formatLastSeen(dateString: string | Date | null): string {
  if (!dateString) return "çevrimdışı";

  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Son 1 dakika
  if (diffMins < 1) {
    return "çevrimiçi";
  }

  // Son 1 saat
  if (diffMins < 60) {
    return `${diffMins} dk önce`;
  }

  // Son 24 saat
  if (diffHours < 24) {
    return `${diffHours} saat önce`;
  }

  // Dün
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return "dün görüldü";
  }

  // Daha eski
  return `${formatShortDate(date)} görüldü`;
}

/**
 * Sohbet listesi için zaman formatlar
 */
export function formatConversationTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();

  // Bugün
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // Dün
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return "Dün";
  }

  // Bu hafta
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) {
    return formatDayName(date);
  }

  // Bu yıl
  if (date.getFullYear() === now.getFullYear()) {
    return formatShortDate(date);
  }

  // Farklı yıl
  return formatFullDate(date);
}

/**
 * Kalan süreyi formatlar (anket için)
 */
export function formatTimeRemaining(endDate: string | Date): string {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Sona erdi";
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays} gün kaldı`;
  }

  if (diffHours > 0) {
    return `${diffHours} saat kaldı`;
  }

  return `${diffMins} dk kaldı`;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString("tr-TR", { weekday: "long" });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * ISO tarih string'i oluşturur
 */
export function toISOString(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Relative time (örn: "5 dakika önce")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffSecs < 60) {
    return "az önce";
  }

  if (diffMins < 60) {
    return `${diffMins} dk önce`;
  }

  if (diffHours < 24) {
    return `${diffHours} saat önce`;
  }

  if (diffDays < 7) {
    return `${diffDays} gün önce`;
  }

  return formatShortDate(date);
}
