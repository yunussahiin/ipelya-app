/**
 * AI Settings Form
 * Web Ops AI ayarları formu
 *
 * - Model seçimi ve temperature
 * - System prompt preset ve custom
 * - Tool izinleri
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { RECOMMENDED_MODELS, SYSTEM_PROMPT_PRESETS, getPresetDescription } from "@/lib/ai/types";
import type { SystemPromptPreset } from "@/lib/ai/types";

// Basitleştirilmiş tipler (UI için)
interface SimpleModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  fallback_model?: string;
}

interface SimpleSystemPrompt {
  preset: SystemPromptPreset;
  custom?: string;
}

interface SimpleToolPermissions {
  [key: string]: boolean;
}

// Varsayılan değerler
const DEFAULT_MODEL_CONFIG: SimpleModelConfig = {
  model: "google/gemini-2.0-flash-exp:free",
  temperature: 0.7,
  max_tokens: 4096,
  fallback_model: "meta-llama/llama-3.3-70b-instruct:free"
};

const DEFAULT_SYSTEM_PROMPT: SimpleSystemPrompt = {
  preset: "technical",
  custom: ""
};

const DEFAULT_TOOL_PERMISSIONS: SimpleToolPermissions = {
  lookupUser: true,
  getRecentPosts: true,
  getSystemStats: true,
  searchUsers: true,
  getModerationQueue: true,
  getPostDetails: true
};

export function AISettingsForm() {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Settings state
  const [modelConfig, setModelConfig] = useState<SimpleModelConfig>(DEFAULT_MODEL_CONFIG);
  const [systemPrompt, setSystemPrompt] = useState<SimpleSystemPrompt>(DEFAULT_SYSTEM_PROMPT);
  const [toolPermissions, setToolPermissions] =
    useState<SimpleToolPermissions>(DEFAULT_TOOL_PERMISSIONS);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/ops/ai/settings");
        if (!response.ok) throw new Error("Failed to load settings");

        const data = await response.json();

        if (data.settings?.model_config) {
          setModelConfig(data.settings.model_config);
        }
        if (data.settings?.system_prompt) {
          setSystemPrompt(data.settings.system_prompt);
        }
        if (data.settings?.tool_permissions) {
          setToolPermissions(data.settings.tool_permissions);
        }
      } catch (error) {
        console.error("[AI Settings] Load error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Save all settings
  const saveAllSettings = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Model config
      await fetch("/api/ops/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "model_config", value: modelConfig })
      });

      // System prompt
      await fetch("/api/ops/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "system_prompt", value: systemPrompt })
      });

      // Tool permissions
      await fetch("/api/ops/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "tool_permissions", value: toolPermissions })
      });

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[AI Settings] Save error:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [modelConfig, systemPrompt, toolPermissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="model" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="tools">Tool İzinleri</TabsTrigger>
        </TabsList>

        {/* Model Settings */}
        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Ayarları</CardTitle>
              <CardDescription>AI modelini ve parametrelerini yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={modelConfig.model}
                  onValueChange={(value) => setModelConfig({ ...modelConfig, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Model seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOMMENDED_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          {model.free && (
                            <Badge variant="secondary" className="text-xs">
                              Ücretsiz
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {RECOMMENDED_MODELS.find((m) => m.id === modelConfig.model)?.description ||
                    "Özel model seçildi"}
                </p>
              </div>

              {/* Custom Model Input */}
              <div className="space-y-2">
                <Label htmlFor="customModel">Özel Model ID (Opsiyonel)</Label>
                <Input
                  id="customModel"
                  placeholder="örn: mistralai/mistral-7b-instruct:free"
                  value={
                    RECOMMENDED_MODELS.some((m) => m.id === modelConfig.model)
                      ? ""
                      : modelConfig.model
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setModelConfig({ ...modelConfig, model: e.target.value });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  OpenRouter model ID&apos;si girin. Listede olmayan modelleri kullanmak için.
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:underline"
                  >
                    Model listesi →
                  </a>
                </p>
              </div>

              <Separator />

              {/* Temperature */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Temperature: {modelConfig.temperature}</Label>
                  <span className="text-xs text-muted-foreground">
                    Düşük = Daha tutarlı, Yüksek = Daha yaratıcı
                  </span>
                </div>
                <Slider
                  value={[modelConfig.temperature]}
                  onValueChange={([value]) =>
                    setModelConfig({ ...modelConfig, temperature: value })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Maksimum Token</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={modelConfig.max_tokens}
                  onChange={(e) =>
                    setModelConfig({ ...modelConfig, max_tokens: parseInt(e.target.value) || 4096 })
                  }
                  min={256}
                  max={32768}
                />
                <p className="text-xs text-muted-foreground">
                  Yanıt için maksimum token sayısı (256-32768)
                </p>
              </div>

              <Separator />

              {/* Fallback Model */}
              <div className="space-y-2">
                <Label htmlFor="fallbackModel">Yedek Model</Label>
                <Select
                  value={modelConfig.fallback_model || ""}
                  onValueChange={(value) =>
                    setModelConfig({ ...modelConfig, fallback_model: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yedek model seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOMMENDED_MODELS.filter((m) => m.id !== modelConfig.model).map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          {model.free && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Free
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ana model rate limit veya hata verirse otomatik geçiş yapılır
                </p>
              </div>

              {/* Custom Fallback Model Input */}
              <div className="space-y-2">
                <Label htmlFor="customFallbackModel">Özel Yedek Model ID (Opsiyonel)</Label>
                <Input
                  id="customFallbackModel"
                  placeholder="örn: anthropic/claude-3-haiku"
                  value={
                    RECOMMENDED_MODELS.some((m) => m.id === modelConfig.fallback_model)
                      ? ""
                      : modelConfig.fallback_model || ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setModelConfig({ ...modelConfig, fallback_model: e.target.value });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Listede olmayan bir yedek model kullanmak için
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Prompt Settings */}
        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>AI&apos;ın davranışını belirleyen sistem mesajı</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset Selection */}
              <div className="space-y-2">
                <Label>Preset</Label>
                <Select
                  value={systemPrompt.preset}
                  onValueChange={(value) =>
                    setSystemPrompt({ ...systemPrompt, preset: value as SystemPromptPreset })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Preset seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_PROMPT_PRESETS.map((preset) => (
                      <SelectItem key={preset} value={preset}>
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getPresetDescription(systemPrompt.preset)}
                </p>
              </div>

              <Separator />

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Özel Ek Talimatlar</Label>
                <Textarea
                  id="customPrompt"
                  value={systemPrompt.custom || ""}
                  onChange={(e) => setSystemPrompt({ ...systemPrompt, custom: e.target.value })}
                  placeholder="Ek talimatlar ekleyin (opsiyonel)..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Preset&apos;e ek olarak özel talimatlar ekleyebilirsiniz
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tool Permissions */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool İzinleri</CardTitle>
              <CardDescription>
                AI&apos;ın kullanabileceği veritabanı sorgulama araçları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(toolPermissions).map(([tool, enabled]) => (
                <div key={tool} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor={tool} className="font-medium">
                      {tool}
                    </Label>
                    <p className="text-xs text-muted-foreground">{getToolDescription(tool)}</p>
                  </div>
                  <Switch
                    id={tool}
                    checked={Boolean(enabled)}
                    onCheckedChange={(checked: boolean) =>
                      setToolPermissions({ ...toolPermissions, [tool]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveStatus === "success" && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">Kaydedildi</span>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Kaydetme hatası</span>
          </div>
        )}
        <Button onClick={saveAllSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Tümünü Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Tool açıklamaları
 */
function getToolDescription(tool: string): string {
  const descriptions: Record<string, string> = {
    lookupUser: "Kullanıcı bilgilerini ID, email veya username ile sorgula",
    getRecentPosts: "Son paylaşılan postları getir",
    getSystemStats: "Platform istatistiklerini getir",
    searchUsers: "Kullanıcıları ara",
    getModerationQueue: "Moderasyon kuyruğunu getir",
    getPostDetails: "Post detaylarını getir"
  };
  return descriptions[tool] || "";
}
