"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { IconInnerShadowTop, IconLoader2, IconLock, IconMail, IconUser } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { registerAction } from "../actions";
import { initialAuthState } from "../types";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialAuthState);

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.15),_transparent_50%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.15),_transparent_50%)]" />

      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
            <IconInnerShadowTop className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-white">Yeni Hesap Oluştur</CardTitle>
            <CardDescription className="text-slate-400">
              İpelya Ops yönetici hesabı aç
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Ad Soyad
              </Label>
              <div className="relative">
                <IconUser className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  required
                  disabled={pending}
                  className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                E-posta
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
                  className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
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
                  className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                />
              </div>
              <p className="text-xs text-slate-500">Şifren en az 8 karakter içermeli</p>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:from-violet-500 hover:to-blue-500 hover:shadow-violet-500/40 disabled:opacity-50"
            >
              {pending ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Kayıt yapılıyor...
                </>
              ) : (
                "Kayıt Ol"
              )}
            </Button>

            <div className="text-center text-sm text-slate-400">
              Zaten hesabın var mı?{" "}
              <Link
                href="/ops/login"
                className="font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                Giriş yap
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
