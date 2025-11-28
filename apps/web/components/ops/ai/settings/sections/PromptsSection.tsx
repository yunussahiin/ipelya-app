"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SYSTEM_PROMPT_PRESETS } from "@/lib/ai/prompts";
import { Code, HeadphonesIcon, BarChart3, Shield } from "lucide-react";

const PRESET_ICONS: Record<string, React.ReactNode> = {
  technical: <Code className="h-5 w-5" />,
  support: <HeadphonesIcon className="h-5 w-5" />,
  analytics: <BarChart3 className="h-5 w-5" />,
  moderation: <Shield className="h-5 w-5" />
};

const PRESET_NAMES: Record<string, string> = {
  technical: "Teknik Asistan",
  support: "Destek Asistanı",
  analytics: "Analitik Asistanı",
  moderation: "Moderasyon Asistanı"
};

export function PromptsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Prompt Presetleri</CardTitle>
          <CardDescription>
            Farklı kullanım senaryoları için hazır system prompt şablonları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(SYSTEM_PROMPT_PRESETS).map(([key, prompt]) => (
              <div key={key} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    {PRESET_ICONS[key]}
                  </div>
                  <div>
                    <div className="font-medium">{PRESET_NAMES[key]}</div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {key}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {prompt.slice(0, 200)}...
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Özel system prompt oluşturma ve düzenleme özelliği yakında eklenecektir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
