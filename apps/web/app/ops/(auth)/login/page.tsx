"use client";

import { Suspense, useActionState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconInnerShadowTop,
  IconLoader2,
  IconLock,
  IconMail,
  IconShieldLock,
  IconSparkles,
  IconUsers
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction } from "../actions";
import { initialAuthState } from "../types";

const featureHighlights = [
  {
    title: "Opsiyonel, hızlı ve güvenli",
    description: "Sadece yetkili yöneticiler ve granular yetki kontrolleri geçerli.",
    icon: <IconShieldLock className="h-4 w-4 text-violet-500" />
  },
  {
    title: "Vaka takibi",
    description: "Günlük olay bildirimlerini takip eden bir sistem yanınızda.",
    icon: <IconSparkles className="h-4 w-4 text-blue-500" />
  },
  {
    title: "Takım odaklı",
    description: "Birden fazla admin aynı anda durumu görüntüleyip müdahale edebilir.",
    icon: <IconUsers className="h-4 w-4 text-teal-400" />
  }
];

function LoginPageContent() {
  const [state, formAction, pending] = useActionState(loginAction, initialAuthState);
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (msg === "confirm") {
      toast.success("Kayıt başarılı! E-postanı kontrol et ve hesabını doğrula.");
    }
  }, [msg]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_40%)]" />

      <Card className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <section className="flex flex-col gap-6 rounded-2xl bg-white/5 p-6 text-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500">
              <IconInnerShadowTop className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">İPELYA OPS</p>
              <h2 className="text-2xl font-semibold text-white">Güvenli ve şeffaf yönetim</h2>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Her oturumda hangi cihazdan giriş yapıldığını ve aktif hesap durumunu net şekilde gör.
            Yalnızca yetkili erişime izin vererek operasyon yönetimini sadeleştir.
          </p>
          <div className="space-y-3">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-2xl bg-slate-900/60 p-4"
              >
                <div className="mt-1 rounded-xl bg-slate-800/60 p-2">{feature.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs text-slate-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <CardHeader className="space-y-2 p-0 text-left">
            <CardTitle className="text-3xl font-semibold text-white">Yönetici Girişi</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              E-posta ve şifrenle oturum açarak yönetim paneline ulaş.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Kurumsal e-posta
                </Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@ipelya.com"
                    required
                    disabled={pending}
                    className="border-slate-700 bg-slate-900/60 pl-10 text-white placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Şifre
                </Label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="En az 8 karakter"
                    required
                    disabled={pending}
                    className="border-slate-700 bg-slate-900/60 pl-10 text-white placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:from-violet-500 hover:to-blue-500 hover:shadow-violet-600/40 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Hesabın yok mu?{" "}
                <Link
                  href="/ops/register"
                  className="font-medium text-slate-100 underline-offset-4 hover:text-white"
                >
                  Kayıt ol
                </Link>
              </p>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
