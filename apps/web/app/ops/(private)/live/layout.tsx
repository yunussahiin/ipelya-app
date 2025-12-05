/**
 * Live Dashboard Layout
 * Canlı yayın yönetim paneli layout'u
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canlı Yayın Yönetimi | Ops",
  description: "LiveKit canlı yayın ve çağrı yönetim paneli"
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
