/**
 * A/B Testing Experiments Page
 *
 * Manage feed algorithm experiments
 * - Create new experiments
 * - View active experiments
 * - Compare results
 * - Apply winner config
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconChartBar,
  IconCheck,
  IconClock,
  IconFlask,
  IconPlus,
  IconRefresh,
  IconTrash
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface Experiment {
  id: string;
  name: string;
  description: string;
  config_type: string;
  variant_a: Record<string, unknown>;
  variant_b: Record<string, unknown>;
  allocation: number; // % of users in variant B
  status: "draft" | "running" | "completed" | "cancelled";
  start_date: string | null;
  end_date: string | null;
  results?: {
    variant_a: { engagement: number; users: number };
    variant_b: { engagement: number; users: number };
    winner?: "a" | "b" | "tie";
  };
  created_at: string;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Taslak", variant: "secondary" },
  running: { label: "Çalışıyor", variant: "default" },
  completed: { label: "Tamamlandı", variant: "outline" },
  cancelled: { label: "İptal Edildi", variant: "destructive" }
};

const CONFIG_TYPES = [
  { id: "weights", label: "Scoring Weights" },
  { id: "vibe_matrix", label: "Vibe Matrix" },
  { id: "intent_matrix", label: "Intent Matrix" },
  { id: "diversity", label: "Diversity Settings" }
];

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // New experiment form
  const [newExperiment, setNewExperiment] = useState({
    name: "",
    description: "",
    config_type: "weights",
    allocation: 50,
    duration_days: 7
  });
  const [creating, setCreating] = useState(false);

  // Fetch experiments
  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ops/feed/experiments");
      const data = await response.json();

      if (data.success) {
        setExperiments(data.data.experiments);
      }
    } catch (error) {
      console.error("Experiments fetch error:", error);
      toast.error("Deneyler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  // Create experiment
  const handleCreate = async () => {
    if (!newExperiment.name) {
      toast.error("Deney adı gerekli");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/ops/feed/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExperiment)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Deney oluşturuldu");
        setCreateDialogOpen(false);
        setNewExperiment({
          name: "",
          description: "",
          config_type: "weights",
          allocation: 50,
          duration_days: 7
        });
        fetchExperiments();
      } else {
        toast.error(data.error || "Oluşturma başarısız");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Oluşturma hatası");
    } finally {
      setCreating(false);
    }
  };

  // Start experiment
  const handleStart = async (id: string) => {
    try {
      const response = await fetch(`/api/ops/feed/experiments/${id}/start`, {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Deney başlatıldı");
        fetchExperiments();
      } else {
        toast.error(data.error || "Başlatma başarısız");
      }
    } catch (error) {
      console.error("Start error:", error);
      toast.error("Başlatma hatası");
    }
  };

  // Stop experiment
  const handleStop = async (id: string) => {
    try {
      const response = await fetch(`/api/ops/feed/experiments/${id}/stop`, {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Deney durduruldu");
        fetchExperiments();
      } else {
        toast.error(data.error || "Durdurma başarısız");
      }
    } catch (error) {
      console.error("Stop error:", error);
      toast.error("Durdurma hatası");
    }
  };

  // Apply winner
  const handleApplyWinner = async (id: string, winner: "a" | "b" | "tie") => {
    if (winner === "tie") {
      toast.info("Berabere sonuçlanan deneylerde kazanan uygulanamaz");
      return;
    }
    try {
      const response = await fetch(`/api/ops/feed/experiments/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Kazanan konfigürasyon uygulandı");
        fetchExperiments();
      } else {
        toast.error(data.error || "Uygulama başarısız");
      }
    } catch (error) {
      console.error("Apply error:", error);
      toast.error("Uygulama hatası");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground">Feed algoritması deneylerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchExperiments}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Yeni Deney
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Deney Oluştur</DialogTitle>
                <DialogDescription>
                  Feed algoritması için yeni bir A/B testi oluşturun
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Deney Adı</Label>
                  <Input
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                    placeholder="Örn: Vibe Matching v2"
                  />
                </div>

                <div>
                  <Label>Açıklama</Label>
                  <Textarea
                    value={newExperiment.description}
                    onChange={(e) =>
                      setNewExperiment({ ...newExperiment, description: e.target.value })
                    }
                    placeholder="Deney hakkında açıklama..."
                  />
                </div>

                <div>
                  <Label>Konfigürasyon Türü</Label>
                  <Select
                    value={newExperiment.config_type}
                    onValueChange={(value) =>
                      setNewExperiment({ ...newExperiment, config_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFIG_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Kullanıcı Dağılımı (Variant B: {newExperiment.allocation}%)</Label>
                  <Slider
                    value={[newExperiment.allocation]}
                    onValueChange={([v]) => setNewExperiment({ ...newExperiment, allocation: v })}
                    min={10}
                    max={90}
                    step={5}
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Variant A: {100 - newExperiment.allocation}% | Variant B:{" "}
                    {newExperiment.allocation}%
                  </p>
                </div>

                <div>
                  <Label>Süre (Gün)</Label>
                  <Input
                    type="number"
                    value={newExperiment.duration_days}
                    onChange={(e) =>
                      setNewExperiment({
                        ...newExperiment,
                        duration_days: parseInt(e.target.value) || 7
                      })
                    }
                    min={1}
                    max={30}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Experiments List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : experiments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFlask className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Henüz Deney Yok</h3>
            <p className="text-sm text-muted-foreground">
              İlk A/B testinizi oluşturmak için &quot;Yeni Deney&quot; butonuna tıklayın
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {experiments.map((experiment) => (
            <Card key={experiment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconFlask className="h-5 w-5" />
                      {experiment.name}
                    </CardTitle>
                    <CardDescription>{experiment.description}</CardDescription>
                  </div>
                  <Badge variant={STATUS_LABELS[experiment.status]?.variant || "secondary"}>
                    {STATUS_LABELS[experiment.status]?.label || experiment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Config Type */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Konfigürasyon:</span>
                  <Badge variant="outline">
                    {CONFIG_TYPES.find((t) => t.id === experiment.config_type)?.label ||
                      experiment.config_type}
                  </Badge>
                </div>

                {/* Allocation */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Variant A ({100 - experiment.allocation}%)</span>
                    <span>Variant B ({experiment.allocation}%)</span>
                  </div>
                  <Progress value={experiment.allocation} className="h-2" />
                </div>

                {/* Dates */}
                {experiment.start_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconClock className="h-4 w-4" />
                    <span>
                      {new Date(experiment.start_date).toLocaleDateString("tr-TR")}
                      {experiment.end_date &&
                        ` - ${new Date(experiment.end_date).toLocaleDateString("tr-TR")}`}
                    </span>
                  </div>
                )}

                {/* Results */}
                {experiment.results && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <IconChartBar className="h-4 w-4" />
                      Sonuçlar
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Variant A</p>
                        <p className="text-lg font-bold">
                          {experiment.results.variant_a.engagement.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {experiment.results.variant_a.users} kullanıcı
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Variant B</p>
                        <p className="text-lg font-bold">
                          {experiment.results.variant_b.engagement.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {experiment.results.variant_b.users} kullanıcı
                        </p>
                      </div>
                    </div>
                    {experiment.results.winner && (
                      <Badge
                        className="mt-2"
                        variant={experiment.results.winner === "tie" ? "secondary" : "default"}
                      >
                        {experiment.results.winner === "tie"
                          ? "Berabere"
                          : `Kazanan: Variant ${experiment.results.winner.toUpperCase()}`}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {experiment.status === "draft" && (
                    <Button size="sm" onClick={() => handleStart(experiment.id)}>
                      <IconCheck className="mr-1 h-4 w-4" />
                      Başlat
                    </Button>
                  )}
                  {experiment.status === "running" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStop(experiment.id)}
                    >
                      <IconTrash className="mr-1 h-4 w-4" />
                      Durdur
                    </Button>
                  )}
                  {experiment.status === "completed" && experiment.results?.winner && (
                    <Button
                      size="sm"
                      onClick={() => handleApplyWinner(experiment.id, experiment.results!.winner!)}
                    >
                      <IconCheck className="mr-1 h-4 w-4" />
                      Kazananı Uygula
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
