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
import { RefreshCw, Search, Wrench, FileJson, Sparkles, Image, Mic } from "lucide-react";

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

export function ModelsTable() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toolsOnly, setToolsOnly] = useState(false);

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

  const handleRefetch = () => {
    setToolsOnly((prev) => !prev);
    setTimeout(() => setToolsOnly((prev) => !prev), 0);
  };

  const filteredModels = models.filter(
    (model) =>
      model.id.toLowerCase().includes(search.toLowerCase()) ||
      model.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatContextLength = (length: number | null) => {
    if (!length) return "-";
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Model Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Model Listesi</CardTitle>
            <CardDescription>
              OpenRouter üzerinden kullanılabilir {models.length} model
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtreler */}
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
          <div className="flex items-center space-x-2">
            <Switch id="tools-only" checked={toolsOnly} onCheckedChange={setToolsOnly} />
            <Label htmlFor="tools-only" className="text-sm">
              Sadece Tool Destekli
            </Label>
          </div>
        </div>

        {/* Tablo */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Model</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Özellikler</TableHead>
                <TableHead>Varsayılan Sıcaklık</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.slice(0, 50).map((model) => (
                <TableRow key={model.id} className="hover:bg-accent">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{model.id}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{model.name}</div>
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
                          <Image className="h-3 w-3 mr-1" />
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

        {filteredModels.length > 50 && (
          <p className="text-sm text-muted-foreground text-center">
            {filteredModels.length - 50} model daha var...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
