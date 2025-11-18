import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "İpelya Ops - Giriş",
  description: "İpelya yönetici paneli giriş sayfası"
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
