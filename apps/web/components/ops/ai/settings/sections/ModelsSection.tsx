"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { RefreshCw, Search, Wrench, FileJson, Sparkles, ImageIcon, Mic } from "lucide-react";

interface ModelData {
  id: string;
  name: string;
  description: string;
  context_length: number | null;
  pricing: {
    prompt: string;
    completion: string;
    is_free: boolean;
  };
  capabilities: {
    tools: boolean;
    structured_outputs: boolean;
    input_modalities: string[];
    output_modalities: string[];
  };
  defaults: {
    temperature: number;
    top_p: number;
  };
  supported_parameters: string[];
}

export function ModelsSection() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toolsOnly, setToolsOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/ops/ai/models${toolsOnly ? "?tools_only=true" : ""}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        setModels(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [toolsOnly]);

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.id.toLowerCase().includes(search.toLowerCase()) ||
      model.name.toLowerCase().includes(search.toLowerCase());
    const matchesFree = !freeOnly || model.pricing.is_free;
    return matchesSearch && matchesFree;
  });

  const formatContextLength = (length: number | null) => {
    if (!length) return "-";
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setToolsOnly((prev) => !prev)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tool Destekli
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {models.filter((m) => m.capabilities.tools).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ücretsiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {models.filter((m) => m.pricing.is_free).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vision Destekli
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models.filter((m) => m.capabilities.input_modalities.includes("image")).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Model Listesi</CardTitle>
          <CardDescription>OpenRouter üzerinden kullanılabilir tüm modeller</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Model ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="tools-only" checked={toolsOnly} onCheckedChange={setToolsOnly} />
                <Label htmlFor="tools-only" className="text-sm">
                  Tool Destekli
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="free-only" checked={freeOnly} onCheckedChange={setFreeOnly} />
                <Label htmlFor="free-only" className="text-sm">
                  Ücretsiz
                </Label>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="min-w-[250px]">Model</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Özellikler</TableHead>
                  <TableHead>Sıcaklık</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.slice(0, 100).map((model) => (
                  <TableRow key={model.id} className="hover:bg-accent">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm font-mono">{model.id}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {model.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {model.pricing.is_free ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Free
                        </Badge>
                      ) : (
                        <div className="text-xs space-y-0.5">
                          <div>In: {model.pricing.prompt}</div>
                          <div>Out: {model.pricing.completion}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {formatContextLength(model.context_length)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.tools && (
                          <Badge variant="outline" className="text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            Tools
                          </Badge>
                        )}
                        {model.capabilities.structured_outputs && (
                          <Badge variant="outline" className="text-xs">
                            <FileJson className="h-3 w-3 mr-1" />
                            JSON
                          </Badge>
                        )}
                        {model.capabilities.input_modalities.includes("image") && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Vision
                          </Badge>
                        )}
                        {model.capabilities.input_modalities.includes("audio") && (
                          <Badge variant="outline" className="text-xs">
                            <Mic className="h-3 w-3 mr-1" />
                            Audio
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {model.defaults.temperature.toFixed(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredModels.length > 100 && (
            <p className="text-sm text-muted-foreground text-center">
              {filteredModels.length - 100} model daha var...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
