import Link from "next/link";
import { CalendarDays, Check, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const features = [
  {
    title: "Gerçek zamanlı görünürlük",
    description: "Ürün, gelir ve destek verilerini tek tuvalde topla."
  },
  {
    title: "Takım ritimleri",
    description: "Günlükleri, durum paylaşımlarını ve karar akışını eşle."
  },
  {
    title: "Güven katmanı",
    description: "Kurumsal güvenlik ve izlenebilirlik hazır sunulur."
  }
];

export default function Page() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.2),_transparent_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-16 text-center sm:px-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">ipelya</p>
        </header>

        <main className="mt-12 space-y-8">
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Ipelya yakında burada.
            </h1>
          </div>

          <form className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="you@company.com"
              className="h-12 rounded-full border-white/20 bg-white/5 text-white placeholder:text-white/60 focus-visible:border-cyan-300 focus-visible:ring-cyan-300/40"
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-full bg-white px-6 font-semibold text-slate-900 hover:bg-white/90"
            >
              <Mail className="size-4 text-slate-900" />
              Haber ver
            </Button>
          </form>
          <p className="text-sm text-white/60">
            Sadece önemli kilometre taşlarını paylaşacağız. Spam yok.
          </p>
        </main>

        <footer className="mt-auto space-y-4 pt-16 text-sm text-white/70">
          <div className="flex flex-col items-center gap-2">
            <span>Yeni sayfa hazır olduğunda ilk siz öğrenin.</span>
            <Link
              href="mailto:hello@ipelya.com"
              className="inline-flex items-center gap-2 text-cyan-200 hover:text-cyan-100"
            >
              <Mail className="size-4" />
              hello@ipelya.com
            </Link>
          </div>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} ipelya. Hazırlık aşamasında.
          </p>
        </footer>
      </div>
    </div>
  );
}
