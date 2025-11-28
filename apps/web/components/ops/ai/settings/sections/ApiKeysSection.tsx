"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, ExternalLink, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useState } from "react";

export function ApiKeysSection() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Masked API key (from env)
  const maskedKey = "sk-or-v1-****************************";

  const handleCopy = () => {
    // In production, this would copy the actual key
    navigator.clipboard.writeText("API key copied notification");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Current API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mevcut API Anahtarı
          </CardTitle>
          <CardDescription>OpenRouter API erişimi için kullanılan anahtar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
            <span className="flex-1">{showKey ? "sk-or-v1-abc123...xyz789" : maskedKey}</span>
            <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              >
                Aktif
              </Badge>
              <span className="text-muted-foreground">Environment variable&apos;dan yüklendi</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Info */}
      <Card>
        <CardHeader>
          <CardTitle>API Anahtarı Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Kaynak</span>
              <p className="font-medium">OPENROUTER_API_KEY</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Tip</span>
              <p className="font-medium">Server-side only</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">İzinler</span>
              <p className="font-medium">Chat, Models, Credits</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Rate Limit</span>
              <p className="font-medium">200 req/min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OpenRouter Dashboard Link */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">API Anahtarı Yönetimi</h3>
              <p className="text-sm text-muted-foreground">
                Yeni anahtar oluşturmak veya mevcut anahtarları yönetmek için OpenRouter
                Dashboard&apos;a gidin
              </p>
            </div>
            <Button asChild>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
