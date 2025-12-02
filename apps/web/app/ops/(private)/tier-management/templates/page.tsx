"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowLeft, Plus, Pencil, Trash2, RefreshCw, Search, Coins, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type {
  TierTemplate,
  TierBenefit,
  RecommendedFor,
  CreateTemplateInput,
  UpdateTemplateInput
} from "@/lib/types/tier";
import { RECOMMENDED_FOR_LABELS, LIMIT_TYPE_LABELS, TIER_LEVEL_LABELS } from "@/lib/types/tier";

// Benefit Checkbox with HoverCard
function BenefitCheckboxItem({
  benefit,
  checked,
  onToggle
}: {
  benefit: TierBenefit;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={benefit.id} checked={checked} onCheckedChange={onToggle} />
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <label
            htmlFor={benefit.id}
            className="text-sm cursor-pointer flex items-center gap-1 hover:text-primary transition-colors"
          >
            {benefit.emoji} {benefit.name}
            <Info className="h-3 w-3 text-muted-foreground opacity-50" />
          </label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" side="top" align="start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{benefit.emoji}</span>
              <div>
                <h4 className="font-semibold">{benefit.name}</h4>
                <code className="text-xs text-muted-foreground">{benefit.id}</code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {benefit.has_limit && benefit.limit_type && (
                <Badge variant="outline" className="text-xs">
                  ⏱️ {LIMIT_TYPE_LABELS[benefit.limit_type]}
                </Badge>
              )}
              {benefit.recommended_tier_level && (
                <Badge variant="secondary" className="text-xs">
                  {TIER_LEVEL_LABELS[benefit.recommended_tier_level]}
                </Badge>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<TierTemplate[]>([]);
  const [benefits, setBenefits] = React.useState<TierBenefit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<TierTemplate | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<CreateTemplateInput>({
    id: "",
    name: "",
    description: "",
    suggested_coin_price_monthly: 100,
    suggested_coin_price_yearly: undefined,
    emoji: "",
    color: "#8B5CF6",
    gradient_start: "#8B5CF6",
    gradient_end: "#6366F1",
    default_benefit_ids: [],
    recommended_for: undefined,
    sort_order: 0,
    is_active: true
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, benefitsRes] = await Promise.all([
        fetch(`/api/ops/tier-templates?activeOnly=${!showInactive}&withBenefits=true`),
        fetch("/api/ops/tier-benefits?activeOnly=true")
      ]);

      const templatesData = await templatesRes.json();
      const benefitsData = await benefitsRes.json();

      if (templatesData.success) {
        setTemplates(templatesData.templates);
      }
      if (benefitsData.success) {
        setBenefits(benefitsData.benefits);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Veri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTemplates = React.useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesSearch;
    });
  }, [templates, searchQuery]);

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      suggested_coin_price_monthly: 100,
      suggested_coin_price_yearly: undefined,
      emoji: "",
      color: "#8B5CF6",
      gradient_start: "#8B5CF6",
      gradient_end: "#6366F1",
      default_benefit_ids: [],
      recommended_for: undefined,
      sort_order: 0,
      is_active: true
    });
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.name || !formData.emoji) {
      toast.error("ID, isim ve emoji zorunludur");
      return;
    }

    try {
      const res = await fetch("/api/ops/tier-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("✓ Şablon başarıyla oluşturuldu");
        setCreateDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || "Şablon oluşturulamadı");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Bağlantı hatası");
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    const updateData: UpdateTemplateInput = {
      name: formData.name,
      description: formData.description,
      suggested_coin_price_monthly: formData.suggested_coin_price_monthly,
      suggested_coin_price_yearly: formData.suggested_coin_price_yearly,
      emoji: formData.emoji,
      color: formData.color,
      gradient_start: formData.gradient_start,
      gradient_end: formData.gradient_end,
      default_benefit_ids: formData.default_benefit_ids,
      recommended_for: formData.recommended_for,
      sort_order: formData.sort_order,
      is_active: formData.is_active
    };

    try {
      const res = await fetch(`/api/ops/tier-templates/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("✓ Şablon başarıyla güncellendi");
        setEditDialogOpen(false);
        setSelectedTemplate(null);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || "Şablon güncellenemedi");
      }
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Bağlantı hatası");
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      const res = await fetch(`/api/ops/tier-templates/${selectedTemplate.id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        toast.success("✓ Şablon devre dışı bırakıldı");
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
        fetchData();
      } else {
        toast.error(data.error || "Şablon devre dışı bırakılamadı");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Bağlantı hatası");
    }
  };

  const openEditDialog = (template: TierTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      description: template.description || "",
      suggested_coin_price_monthly: template.suggested_coin_price_monthly,
      suggested_coin_price_yearly: template.suggested_coin_price_yearly || undefined,
      emoji: template.emoji,
      color: template.color,
      gradient_start: template.gradient_start,
      gradient_end: template.gradient_end,
      default_benefit_ids: template.default_benefit_ids || [],
      recommended_for: template.recommended_for || undefined,
      sort_order: template.sort_order,
      is_active: template.is_active
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/tier-management">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tier Şablonları</h1>
            <p className="text-muted-foreground mt-1">
              Creator&apos;ların tier oluştururken kullanacağı şablonları yönetin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Şablon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Tier Şablonu Oluştur</DialogTitle>
                <DialogDescription>
                  Creator&apos;ların tier oluştururken seçeceği yeni bir şablon tanımlayın
                </DialogDescription>
              </DialogHeader>
              <TemplateForm
                formData={formData}
                setFormData={setFormData}
                benefits={benefits}
                isEdit={false}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreate}>Oluştur</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Şablon ara (isim, ID, açıklama)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
              <Label htmlFor="show-inactive" className="text-sm">
                Pasif olanları göster
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center py-8">Yükleniyor...</p>
        ) : filteredTemplates.length === 0 ? (
          <p className="col-span-full text-center py-8">Şablon bulunamadı</p>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`overflow-hidden ${!template.is_active ? "opacity-60" : ""}`}
            >
              {/* Gradient Header */}
              <div
                className="h-20 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${template.gradient_start}, ${template.gradient_end})`
                }}
              >
                <span className="text-5xl">{template.emoji}</span>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <code className="text-xs text-muted-foreground">{template.id}</code>
                  </div>
                  <Badge
                    variant={template.is_active ? "default" : "secondary"}
                    className={
                      template.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : ""
                    }
                  >
                    {template.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}

                {/* Price Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold">
                      {template.suggested_coin_price_monthly} coin/ay
                    </span>
                  </div>
                  {template.suggested_coin_price_yearly && (
                    <span className="text-sm text-muted-foreground">
                      ({template.suggested_coin_price_yearly} coin/yıl)
                    </span>
                  )}
                </div>

                {/* Recommended For */}
                {template.recommended_for && (
                  <Badge variant="outline">
                    🎯 {RECOMMENDED_FOR_LABELS[template.recommended_for]}
                  </Badge>
                )}

                {/* Benefits */}
                {template.benefits && template.benefits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Varsayılan Avantajlar:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.benefits.slice(0, 5).map((benefit) => (
                        <Badge key={benefit.id} variant="secondary" className="text-xs">
                          {benefit.emoji} {benefit.name}
                        </Badge>
                      ))}
                      {template.benefits.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.benefits.length - 5} daha
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Templates Table (Alternative View) */}
      <Card>
        <CardHeader>
          <CardTitle>Tablo Görünümü</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Emoji</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Aylık Fiyat</TableHead>
                <TableHead>Yıllık Fiyat</TableHead>
                <TableHead>Avantaj Sayısı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Şablon bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id} className="hover:bg-accent">
                    <TableCell className="text-2xl">{template.emoji}</TableCell>
                    <TableCell className="font-mono text-xs">{template.id}</TableCell>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-amber-500" />
                        {template.suggested_coin_price_monthly}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.suggested_coin_price_yearly ? (
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500" />
                          {template.suggested_coin_price_yearly}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {template.default_benefit_ids?.length || 0} avantaj
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.is_active ? "default" : "secondary"}
                        className={
                          template.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : ""
                        }
                      >
                        {template.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Şablonu Düzenle</DialogTitle>
            <DialogDescription>{selectedTemplate?.name} şablonunu düzenleyin</DialogDescription>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            setFormData={setFormData}
            benefits={benefits}
            isEdit={true}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEdit}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablonu Devre Dışı Bırak</DialogTitle>
            <DialogDescription>
              <strong>{selectedTemplate?.name}</strong> şablonunu devre dışı bırakmak istediğinize
              emin misiniz? Bu işlem geri alınabilir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Devre Dışı Bırak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template Form Component
interface TemplateFormProps {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
  benefits: TierBenefit[];
  isEdit: boolean;
}

function TemplateForm({ formData, setFormData, benefits, isEdit }: TemplateFormProps) {
  // Group benefits by category
  const groupedBenefits = React.useMemo(() => {
    return {
      content: benefits.filter((b) => b.category === "content"),
      communication: benefits.filter((b) => b.category === "communication"),
      perks: benefits.filter((b) => b.category === "perks")
    };
  }, [benefits]);

  const toggleBenefit = (benefitId: string) => {
    setFormData((prev) => {
      const current = prev.default_benefit_ids || [];
      if (current.includes(benefitId)) {
        return { ...prev, default_benefit_ids: current.filter((id) => id !== benefitId) };
      } else {
        return { ...prev, default_benefit_ids: [...current, benefitId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="font-semibold">Temel Bilgiler</h4>

        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="id">ID (benzersiz)</Label>
            <Input
              id="id"
              placeholder="gold"
              value={formData.id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  id: e.target.value.toLowerCase().replace(/\s+/g, "_")
                }))
              }
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">İsim</Label>
            <Input
              id="name"
              placeholder="Gold"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji</Label>
            <Input
              id="emoji"
              placeholder="🥇"
              value={formData.emoji}
              onChange={(e) => setFormData((prev) => ({ ...prev, emoji: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            placeholder="Orta seviye aboneler için ideal tier"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Fiyatlandırma (Önerilen)</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Kullanıcı tercihine göre bu coin tutarlarını değiştirebilir. Min: 10 coin, Max: 10.000
            coin. Biz aylık ve yıllık önerilerde bulunuyoruz.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_monthly">Aylık Fiyat (coin)</Label>
            <Input
              id="price_monthly"
              type="number"
              value={formData.suggested_coin_price_monthly}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  suggested_coin_price_monthly: parseInt(e.target.value) || 0
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_yearly">Yıllık Fiyat (coin, opsiyonel)</Label>
            <Input
              id="price_yearly"
              type="number"
              placeholder="Boş bırakılabilir"
              value={formData.suggested_coin_price_yearly || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  suggested_coin_price_yearly: e.target.value ? parseInt(e.target.value) : undefined
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="font-semibold">Renkler</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Ana Renk</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradient_start">Gradient Başlangıç</Label>
            <div className="flex gap-2">
              <Input
                id="gradient_start"
                type="color"
                value={formData.gradient_start}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gradient_start: e.target.value }))
                }
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.gradient_start}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gradient_start: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradient_end">Gradient Bitiş</Label>
            <div className="flex gap-2">
              <Input
                id="gradient_end"
                type="color"
                value={formData.gradient_end}
                onChange={(e) => setFormData((prev) => ({ ...prev, gradient_end: e.target.value }))}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.gradient_end}
                onChange={(e) => setFormData((prev) => ({ ...prev, gradient_end: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        {/* Preview */}
        <div
          className="h-16 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${formData.gradient_start}, ${formData.gradient_end})`
          }}
        >
          <span className="text-3xl">{formData.emoji || "🎯"}</span>
          <span className="ml-2 text-white font-semibold">{formData.name || "Önizleme"}</span>
        </div>
      </div>

      {/* Benefits Selection */}
      <div className="space-y-4">
        <h4 className="font-semibold">
          Varsayılan Avantajlar ({formData.default_benefit_ids?.length || 0} seçili)
        </h4>

        <div className="space-y-4">
          {/* Content Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">📺 İçerik</p>
            <div className="grid grid-cols-2 gap-2">
              {groupedBenefits.content.map((benefit) => (
                <BenefitCheckboxItem
                  key={benefit.id}
                  benefit={benefit}
                  checked={formData.default_benefit_ids?.includes(benefit.id) || false}
                  onToggle={() => toggleBenefit(benefit.id)}
                />
              ))}
            </div>
          </div>

          {/* Communication Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">💬 İletişim</p>
            <div className="grid grid-cols-2 gap-2">
              {groupedBenefits.communication.map((benefit) => (
                <BenefitCheckboxItem
                  key={benefit.id}
                  benefit={benefit}
                  checked={formData.default_benefit_ids?.includes(benefit.id) || false}
                  onToggle={() => toggleBenefit(benefit.id)}
                />
              ))}
            </div>
          </div>

          {/* Perks Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">🎁 Ekstra</p>
            <div className="grid grid-cols-2 gap-2">
              {groupedBenefits.perks.map((benefit) => (
                <BenefitCheckboxItem
                  key={benefit.id}
                  benefit={benefit}
                  checked={formData.default_benefit_ids?.includes(benefit.id) || false}
                  onToggle={() => toggleBenefit(benefit.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Other Settings */}
      <div className="space-y-4">
        <h4 className="font-semibold">Diğer Ayarlar</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Önerilen Hedef Kitle</Label>
            <Select
              value={formData.recommended_for || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  recommended_for: value === "none" ? undefined : (value as RecommendedFor)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Belirtilmemiş</SelectItem>
                <SelectItem value="beginner">Başlangıç</SelectItem>
                <SelectItem value="intermediate">Orta</SelectItem>
                <SelectItem value="advanced">İleri</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sıralama</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Aktif</Label>
        </div>
      </div>
    </div>
  );
}
