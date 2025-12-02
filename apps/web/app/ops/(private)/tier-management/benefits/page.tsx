"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Pencil, Trash2, RefreshCw, Search, Filter } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type {
  TierBenefit,
  BenefitCategory,
  LimitType,
  TierLevel,
  CreateBenefitInput,
  UpdateBenefitInput
} from "@/lib/types/tier";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  TIER_LEVEL_LABELS,
  LIMIT_TYPE_LABELS
} from "@/lib/types/tier";

export default function BenefitsPage() {
  const [benefits, setBenefits] = React.useState<TierBenefit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [showInactive, setShowInactive] = React.useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedBenefit, setSelectedBenefit] = React.useState<TierBenefit | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<CreateBenefitInput>({
    id: "",
    name: "",
    description: "",
    emoji: "",
    category: "content",
    has_limit: false,
    limit_type: null,
    recommended_tier_level: null,
    is_active: true,
    sort_order: 0
  });

  const fetchBenefits = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/tier-benefits?activeOnly=${!showInactive}`);
      const data = await res.json();
      if (data.success) {
        setBenefits(data.benefits);
      } else {
        toast.error("Avantajlar yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  React.useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  const filteredBenefits = React.useMemo(() => {
    return benefits.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || b.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [benefits, searchQuery, activeCategory]);

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      emoji: "",
      category: "content",
      has_limit: false,
      limit_type: null,
      recommended_tier_level: null,
      is_active: true,
      sort_order: 0
    });
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.name || !formData.description || !formData.emoji) {
      toast.error("Tüm zorunlu alanları doldurun");
      return;
    }

    try {
      const res = await fetch("/api/ops/tier-benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("✓ Avantaj başarıyla oluşturuldu");
        setCreateDialogOpen(false);
        resetForm();
        fetchBenefits();
      } else {
        toast.error(data.error || "Avantaj oluşturulamadı");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Bağlantı hatası");
    }
  };

  const handleEdit = async () => {
    if (!selectedBenefit) return;

    const updateData: UpdateBenefitInput = {
      name: formData.name,
      description: formData.description,
      emoji: formData.emoji,
      category: formData.category,
      has_limit: formData.has_limit,
      limit_type: formData.limit_type,
      recommended_tier_level: formData.recommended_tier_level,
      is_active: formData.is_active,
      sort_order: formData.sort_order
    };

    try {
      const res = await fetch(`/api/ops/tier-benefits/${selectedBenefit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("✓ Avantaj başarıyla güncellendi");
        setEditDialogOpen(false);
        setSelectedBenefit(null);
        resetForm();
        fetchBenefits();
      } else {
        toast.error(data.error || "Avantaj güncellenemedi");
      }
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Bağlantı hatası");
    }
  };

  const handleDelete = async () => {
    if (!selectedBenefit) return;

    try {
      const res = await fetch(`/api/ops/tier-benefits/${selectedBenefit.id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        toast.success("✓ Avantaj devre dışı bırakıldı");
        setDeleteDialogOpen(false);
        setSelectedBenefit(null);
        fetchBenefits();
      } else {
        toast.error(data.error || "Avantaj devre dışı bırakılamadı");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Bağlantı hatası");
    }
  };

  const openEditDialog = (benefit: TierBenefit) => {
    setSelectedBenefit(benefit);
    setFormData({
      id: benefit.id,
      name: benefit.name,
      description: benefit.description,
      emoji: benefit.emoji,
      category: benefit.category,
      has_limit: benefit.has_limit,
      limit_type: benefit.limit_type,
      recommended_tier_level: benefit.recommended_tier_level,
      is_active: benefit.is_active,
      sort_order: benefit.sort_order
    });
    setEditDialogOpen(true);
  };

  const getCategoryBadgeColor = (category: BenefitCategory) => {
    switch (category) {
      case "content":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "communication":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "perks":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Avantaj Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Tier avantajlarını görüntüleyin, düzenleyin ve yeni avantajlar ekleyin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchBenefits}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Avantaj
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Yeni Avantaj Oluştur</DialogTitle>
                <DialogDescription>
                  Creator tier&apos;larında kullanılacak yeni bir avantaj tanımlayın
                </DialogDescription>
              </DialogHeader>
              <BenefitForm formData={formData} setFormData={setFormData} isEdit={false} />
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
                placeholder="Avantaj ara (isim, açıklama, ID)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="content">📺 İçerik</SelectItem>
                    <SelectItem value="communication">💬 İletişim</SelectItem>
                    <SelectItem value="perks">🎁 Ekstra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="text-sm">
                  Pasif olanları göster
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Table */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Tablo Görünümü</TabsTrigger>
          <TabsTrigger value="cards">Kart Görünümü</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Emoji</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Önerilen Tier</TableHead>
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
                  ) : filteredBenefits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Avantaj bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBenefits.map((benefit) => (
                      <TableRow key={benefit.id} className="hover:bg-accent">
                        <TableCell className="text-2xl">{benefit.emoji}</TableCell>
                        <TableCell className="font-mono text-xs">{benefit.id}</TableCell>
                        <TableCell className="font-medium">{benefit.name}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadgeColor(benefit.category)}>
                            {CATEGORY_ICONS[benefit.category]} {CATEGORY_LABELS[benefit.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {benefit.has_limit && benefit.limit_type ? (
                            <Badge variant="outline">{LIMIT_TYPE_LABELS[benefit.limit_type]}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {benefit.recommended_tier_level ? (
                            <Badge variant="secondary">
                              {TIER_LEVEL_LABELS[benefit.recommended_tier_level]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={benefit.is_active ? "default" : "secondary"}
                            className={
                              benefit.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : ""
                            }
                          >
                            {benefit.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(benefit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBenefit(benefit);
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
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-full text-center py-8">Yükleniyor...</p>
            ) : filteredBenefits.length === 0 ? (
              <p className="col-span-full text-center py-8">Avantaj bulunamadı</p>
            ) : (
              filteredBenefits.map((benefit) => (
                <Card key={benefit.id} className={!benefit.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{benefit.emoji}</span>
                        <div>
                          <CardTitle className="text-lg">{benefit.name}</CardTitle>
                          <code className="text-xs text-muted-foreground">{benefit.id}</code>
                        </div>
                      </div>
                      <Badge className={getCategoryBadgeColor(benefit.category)}>
                        {CATEGORY_LABELS[benefit.category]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{benefit.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {benefit.has_limit && benefit.limit_type && (
                        <Badge variant="outline">⏱️ {LIMIT_TYPE_LABELS[benefit.limit_type]}</Badge>
                      )}
                      {benefit.recommended_tier_level && (
                        <Badge variant="secondary">
                          {TIER_LEVEL_LABELS[benefit.recommended_tier_level]}
                        </Badge>
                      )}
                      <Badge
                        variant={benefit.is_active ? "default" : "secondary"}
                        className={
                          benefit.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : ""
                        }
                      >
                        {benefit.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(benefit)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBenefit(benefit);
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
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Avantajı Düzenle</DialogTitle>
            <DialogDescription>{selectedBenefit?.name} avantajını düzenleyin</DialogDescription>
          </DialogHeader>
          <BenefitForm formData={formData} setFormData={setFormData} isEdit={true} />
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
            <DialogTitle>Avantajı Devre Dışı Bırak</DialogTitle>
            <DialogDescription>
              <strong>{selectedBenefit?.name}</strong> avantajını devre dışı bırakmak istediğinize
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

// Benefit Form Component
interface BenefitFormProps {
  formData: CreateBenefitInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateBenefitInput>>;
  isEdit: boolean;
}

function BenefitForm({ formData, setFormData, isEdit }: BenefitFormProps) {
  return (
    <div className="space-y-4">
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="id">ID (benzersiz)</Label>
          <Input
            id="id"
            placeholder="exclusive_stories"
            value={formData.id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                id: e.target.value.toLowerCase().replace(/\s+/g, "_")
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Küçük harf ve alt çizgi kullanın (örn: exclusive_stories)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">İsim</Label>
          <Input
            id="name"
            placeholder="Özel Hikayeler"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            placeholder="📖"
            value={formData.emoji}
            onChange={(e) => setFormData((prev) => ({ ...prev, emoji: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          placeholder="Sadece abonelerin görebileceği özel story paylaşımları"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select
            value={formData.category}
            onValueChange={(value: BenefitCategory) =>
              setFormData((prev) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="content">📺 İçerik</SelectItem>
              <SelectItem value="communication">💬 İletişim</SelectItem>
              <SelectItem value="perks">🎁 Ekstra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Önerilen Tier</Label>
          <Select
            value={formData.recommended_tier_level || "none"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                recommended_tier_level: value === "none" ? null : (value as TierLevel)
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Belirtilmemiş</SelectItem>
              <SelectItem value="bronze">🥉 Bronze</SelectItem>
              <SelectItem value="silver">🥈 Silver</SelectItem>
              <SelectItem value="gold">🥇 Gold</SelectItem>
              <SelectItem value="diamond">💎 Diamond</SelectItem>
              <SelectItem value="vip">👑 VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="has_limit"
            checked={formData.has_limit}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                has_limit: checked,
                limit_type: checked ? prev.limit_type : null
              }))
            }
          />
          <Label htmlFor="has_limit">Limit var mı?</Label>
        </div>

        {formData.has_limit && (
          <Select
            value={formData.limit_type || "monthly"}
            onValueChange={(value: LimitType) =>
              setFormData((prev) => ({ ...prev, limit_type: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
              <SelectItem value="yearly">Yıllık</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="flex items-center gap-2 pt-8">
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
