"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
  is_default: boolean;
}

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesUpdated?: () => void;
}

const ICON_OPTIONS = [
  "📢",
  "🔧",
  "🔒",
  "🎁",
  "⚠️",
  "ℹ️",
  "✅",
  "❌",
  "🚀",
  "💡",
  "🎯",
  "📊",
  "🔔",
  "💬",
  "🎉",
  "⏰"
];

const COLOR_OPTIONS = [
  { value: "bg-blue-100 text-blue-800", label: "Blue" },
  { value: "bg-yellow-100 text-yellow-800", label: "Yellow" },
  { value: "bg-red-100 text-red-800", label: "Red" },
  { value: "bg-green-100 text-green-800", label: "Green" },
  { value: "bg-purple-100 text-purple-800", label: "Purple" },
  { value: "bg-pink-100 text-pink-800", label: "Pink" },
  { value: "bg-orange-100 text-orange-800", label: "Orange" },
  { value: "bg-indigo-100 text-indigo-800", label: "Indigo" }
];

export function CategoryManagementModal({
  open,
  onOpenChange,
  onCategoriesUpdated
}: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    icon: "📢",
    color: "bg-blue-100 text-blue-800",
    description: ""
  });

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("notification_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
      toast.error("✕ Kategoriler yüklenirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!formData.name || !formData.label) {
      toast.error("✕ Kategori Adı ve Etiketi zorunludur!");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) throw new Error("User not authenticated");

      if (editingId) {
        // Update
        const { error } = await supabase
          .from("notification_categories")
          .update({
            name: formData.name,
            label: formData.label,
            icon: formData.icon,
            color: formData.color,
            description: formData.description
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("✓ Kategori başarıyla güncellendi!");
      } else {
        // Insert
        const { error } = await supabase.from("notification_categories").insert({
          name: formData.name,
          label: formData.label,
          icon: formData.icon,
          color: formData.color,
          description: formData.description,
          admin_id: session.user.id
        });

        if (error) throw error;
        toast.success("✓ Kategori başarıyla oluşturuldu!");
      }

      setFormData({
        name: "",
        label: "",
        icon: "📢",
        color: "bg-blue-100 text-blue-800",
        description: ""
      });
      setShowForm(false);
      setEditingId(null);
      loadCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error("✕ Kategori kaydedilirken hata oluştu!");
    }
  };

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      label: category.label,
      icon: category.icon,
      color: category.color,
      description: category.description || ""
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("notification_categories").delete().eq("id", id);

      if (error) throw error;
      toast.success("✓ Kategori başarıyla silindi!");
      setDeleteConfirmId(null);
      loadCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("✕ Kategori silinirken hata oluştu!");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      label: "",
      icon: "📢",
      color: "bg-blue-100 text-blue-800",
      description: ""
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kategorileri Yönet</DialogTitle>
            <DialogDescription>
              Bildirim kategorilerini oluşturun, düzenleyin ve silin
            </DialogDescription>
          </DialogHeader>

          {showForm && (
            <Card className="">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? "Kategoriyi Düzenle" : "Yeni Kategori Oluştur"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Kategori Adı (İç Kullanım) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="announcement"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Kategori Etiketi (Görüntüleme) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="📢 Duyuru"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">İkon</label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`text-2xl p-2 rounded border-2 transition ${
                            formData.icon === icon
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Renk</label>
                    <div className="space-y-2 mt-1">
                      {COLOR_OPTIONS.map((colorOpt) => (
                        <button
                          key={colorOpt.value}
                          onClick={() => setFormData({ ...formData, color: colorOpt.value })}
                          className={`w-full px-3 py-2 rounded text-sm font-medium transition border-2 ${
                            formData.color === colorOpt.value
                              ? `${colorOpt.value} border-gray-800`
                              : `${colorOpt.value} border-transparent hover:border-gray-300`
                          }`}
                        >
                          {colorOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
                  <textarea
                    placeholder="Bu kategori hakkında açıklama..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveCategory} className="flex-1">
                    {editingId ? "Güncelle" : "Oluştur"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!showForm && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Henüz kategori yok</p>
              ) : (
                categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl shrink-0">{category.icon}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{category.label}</p>
                            <p className="text-xs text-gray-500">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmId(category.id)}
                            disabled={category.is_default}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          <DialogFooter>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kategori
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi Sil</DialogTitle>
            <DialogDescription>
              Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteCategory(deleteConfirmId)}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
