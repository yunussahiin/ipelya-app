// Bu dosya ortak UI bileşenlerine örnek olması için hazırlanmıştır.
import type { ReactNode } from "react";

export function PlaceholderCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
      <strong>{title}</strong>
      <div>{children ?? "TODO: Ortak bileşen içeriğini uygula."}</div>
    </div>
  );
}
