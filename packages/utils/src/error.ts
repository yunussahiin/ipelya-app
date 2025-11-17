// Bu dosya hata yönetimi yardımcı fonksiyonlarının temelini oluşturur.
export function asAppErrorPlaceholder(error: unknown) {
  return error instanceof Error ? error.message : "Bilinmeyen hata";
}
