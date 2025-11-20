"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Loader2, Plus, Trash2, Edit2, Settings } from "lucide-react";
import { toast } from "sonner";
import { CategoryManagementModal } from "./components/CategoryManagementModal";
import { TemplateFormModal } from "./components/TemplateFormModal";

interface Template {
  id: string;
  name: string;
  title: string;
  body: string;
  category?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
  is_default: boolean;
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  useEffect(() => {
    loadCategoriesAndTemplates();
  }, []);

  const loadCategoriesAndTemplates = async () => {
    await Promise.all([loadCategories(), loadTemplates()]);
  };

  const loadCategories = async () => {
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
    }
  };

  const loadTemplates = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("notification_templates").delete().eq("id", id);

      if (error) throw error;
      toast.success("✓ Şablon başarıyla silindi!");
      setDeleteConfirmId(null);
      loadTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error("✕ Şablon silinirken hata oluştu!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bildirim Şablonları</h1>
          <p className="text-muted-foreground mt-2">
            Sık kullanılan bildirim şablonlarını oluşturun ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Kategorileri Yönet
          </Button>
          <Button onClick={handleNewTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      <TemplateFormModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        editingTemplate={editingTemplate}
        categories={categories}
        onTemplateSaved={() => {
          loadTemplates();
          setShowTemplateModal(false);
        }}
      />

      {/* Category Filter */}
      {!loading && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Tümü ({templates.length})
          </Button>
          {categories.map((cat: Category) => {
            const count = templates.filter((t) => t.category === cat.name).length;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {templates.length === 0 ? "Henüz şablon yok" : "Bu kategoride şablon yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const categoryInfo = categories.find((c: Category) => c.name === template.category);
            return (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {categoryInfo && (
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold shrink-0 ${categoryInfo.color}`}
                      >
                        {categoryInfo.label}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Başlık</p>
                    <p className="text-sm font-medium">{template.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">İçerik</p>
                    <p className="text-sm text-gray-700">{template.body}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateModal(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablonu Sil</DialogTitle>
            <DialogDescription>
              Bu şablonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteTemplate(deleteConfirmId)}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <CategoryManagementModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onCategoriesUpdated={() => {
          // Kategoriler güncellendiğinde, sayfayı refresh et
          loadCategoriesAndTemplates();
        }}
      />
    </div>
  );
}
