"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Hoş Geldiniz</h1>
            <p className="text-muted-foreground">UI ile oluşturulmuş modern bir arayüz</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hızlı Başlangıç</CardTitle>
                <CardDescription>Projenize hemen başlamak için adımları takip edin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Adınız</Label>
                    <Input id="name" placeholder="Adınızı girin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" placeholder="E-posta adresiniz" type="email" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Vazgeç</Button>
                <Button>Devam Et</Button>
              </CardFooter>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bileşenler</CardTitle>
                  <CardDescription>Kullanılabilir shadcn bileşenleri</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full">
                    Buton
                  </Button>
                  <Button variant="outline" className="w-full">
                    Kart
                  </Button>
                  <Button variant="outline" className="w-full">
                    Form
                  </Button>
                  <Button variant="outline" className="w-full">
                    Tab
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Renk Teması</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => document.documentElement.classList.add("dark")}
                  >
                    Koyu
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => document.documentElement.classList.remove("dark")}
                  >
                    Açık
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
