"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Save, RotateCcw } from "lucide-react";
import { RECOMMENDED_MODELS } from "@/lib/ai/types";

interface Preferences {
  defaultModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

const DEFAULT_PREFERENCES: Preferences = {
  defaultModel: "openai/gpt-oss-20b:free",
  fallbackModel: "openai/gpt-oss-20b:free",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0
};

function getInitialPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const stored = localStorage.getItem("ai-chat-preferences");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
  return DEFAULT_PREFERENCES;
}

export function PreferencesSection() {
  const [preferences, setPreferences] = useState<Preferences>(getInitialPreferences);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("ai-chat-preferences", JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem("ai-chat-preferences");
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Model Seçimi</CardTitle>
          <CardDescription>Varsayılan ve yedek model ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-model">Varsayılan Model</Label>
              <Select
                value={preferences.defaultModel}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, defaultModel: value }))
                }
              >
                <SelectTrigger id="default-model">
                  <SelectValue placeholder="Model seçin" />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDED_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.free && <span className="text-xs text-green-600">Free</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chat başlatıldığında kullanılacak model
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-model">Yedek Model</Label>
              <Select
                value={preferences.fallbackModel}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, fallbackModel: value }))
                }
              >
                <SelectTrigger id="fallback-model">
                  <SelectValue placeholder="Model seçin" />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDED_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.free && <span className="text-xs text-green-600">Free</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Rate limit durumunda kullanılacak model
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Model Parametreleri</CardTitle>
          <CardDescription>Yanıt üretimi için varsayılan parametreler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {preferences.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[preferences.temperature]}
              onValueChange={([value]) =>
                setPreferences((prev) => ({ ...prev, temperature: value }))
              }
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Düşük değerler daha tutarlı, yüksek değerler daha yaratıcı yanıtlar üretir
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Top P</Label>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {preferences.topP.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[preferences.topP]}
              onValueChange={([value]) => setPreferences((prev) => ({ ...prev, topP: value }))}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Nucleus sampling - kelime seçiminde çeşitlilik kontrolü
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              value={preferences.maxTokens}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))
              }
              min={256}
              max={128000}
            />
            <p className="text-xs text-muted-foreground">
              Yanıtta üretilecek maksimum token sayısı
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Varsayılana Dön
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          {saved ? "Kaydedildi!" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
