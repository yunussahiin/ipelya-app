"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShieldCheck, Sparkles, Video } from "lucide-react"

const metrics = [
  { label: "Shadow Geliri", value: "₺182K", trend: "+24%", accent: "bg-fuchsia-500/30" },
  { label: "Aktif Creator", value: "342", trend: "+18 online", accent: "bg-blue-500/30" },
  { label: "Shadow Feed CTR", value: "41%", trend: "hedef +6%", accent: "bg-emerald-500/30" },
]

const modules = [
  { title: "Shadow Mode Yönetimi", body: "PIN, anti-ss, firewall kurallarını eş zamanlı düzenleyin." },
  { title: "AI Fantasy Stüdyosu", body: "Creator brief → OpenAI / LiveKit ile sahne üretimi." },
  { title: "PPV & Coin Akışı", body: "Stripe, Edge Functions ve coin ekonomisini tek panelden ayarla." },
]

const sessions = [
  { time: "12:30", title: "Luna Shadow / LiveKit 1:1", status: "Canlı" },
  { time: "14:00", title: "Nova Flux / Shadow Feed Premier", status: "Planlandı" },
  { time: "16:15", title: "Mira Echo / ASMR drop", status: "Hazırlanıyor" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.15),transparent_45%)]" />
        <main className="container relative z-10 mx-auto px-4 py-16 space-y-14">
          <section className="grid gap-10 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-6">
              <Badge className="w-fit border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide">
                Shadow Studio
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Creator'ların shadow mod deneyimini tek panelde tasarlayın.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Mobil (Expo) + Web (Next.js) + Supabase Edge Functions altyapısı için canlı bir örnek ekran.
                Aşağıdaki bileşenler gerçek akışların nasıl modellenebileceğini gösterir.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2">
                  Shadow Flow'u Başlat <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Demo İncele
                </Button>
              </div>
            </div>
            <Card className="bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle>Shadow Feed Önizlemesi</CardTitle>
                <CardDescription>TODO: Live embed ile gerçek feed akışını bağla.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-transparent p-6">
                  <p className="text-sm uppercase text-white/70">Creator Spotlight</p>
                  <p className="mt-2 text-2xl font-semibold">“Shadow PIN doğrulandı · Anti-SS aktif”</p>
                  <p className="mt-3 text-white/80">
                    Shadow feed, PPV galerisi ve screenshot firewall bu panelden yönetilecek.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                  <Video className="h-10 w-10 text-fuchsia-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">LiveKit</p>
                    <p className="text-lg font-medium text-white">Canlı oda yayında · 312 izleyici</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="ghost" className="gap-2">
                  Shadow Mode Detayı <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label} className="relative overflow-hidden">
                <div className={`absolute inset-0 ${metric.accent} blur-3xl`} />
                <CardHeader className="relative">
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-3xl">{metric.value}</CardTitle>
                </CardHeader>
                <CardFooter className="relative text-emerald-400">{metric.trend}</CardFooter>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <Card>
              <CardHeader>
                <CardTitle>Modüller</CardTitle>
                <CardDescription>Web + mobil tarafında yeniden kullanılabilir akışlar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {modules.map((module) => (
                  <div key={module.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-fuchsia-500" />
                      <p className="font-medium">{module.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Canlı Oturumlar</CardTitle>
                  <CardDescription>Shadow feed & LiveKit takvimi</CardDescription>
                </div>
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.title}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4"
                  >
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{session.time}</p>
                      <p className="text-base font-medium">{session.title}</p>
                      <p className="text-xs text-amber-300">TODO: LiveKit token üretimini bağla.</p>
                    </div>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Takvimi Yönet
                </Button>
              </CardFooter>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}
