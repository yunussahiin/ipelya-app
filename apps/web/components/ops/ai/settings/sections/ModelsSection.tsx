"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { DataTable, columns, type ModelData } from "./models";

export function ModelsSection() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/ai/models");
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

  useEffect(() => {
    fetchModels();
  }, []);

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
          <Button variant="outline" size="sm" onClick={fetchModels}>
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

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Listesi</CardTitle>
          <CardDescription>
            OpenRouter üzerinden kullanılabilir tüm modeller. Satıra tıklayarak endpoint detaylarını
            görüntüleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={models} />
        </CardContent>
      </Card>
    </div>
  );
}
