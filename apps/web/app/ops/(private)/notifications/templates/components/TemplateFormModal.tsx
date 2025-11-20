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
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

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

interface TemplateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: Template | null;
  categories?: Category[];
  onTemplateSaved?: () => void;
}

export function TemplateFormModal({
  open,
  onOpenChange,
  editingTemplate,
  categories = [],
  onTemplateSaved
}: TemplateFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    body: "",
    category: ""
  });
  const [loadedCategories, setLoadedCategories] = useState<Category[]>(categories);

  useEffect(() => {
    // Kategoriler prop'tan gelmediyse, database'den yükle
    if (categories.length > 0) {
      setLoadedCategories(categories);
    } else if (open) {
      loadCategories();
    }
  }, [categories, open]);

  const loadCategories = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("notification_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoadedCategories(data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        title: editingTemplate.title,
        body: editingTemplate.body,
        category: editingTemplate.category || ""
      });
    } else {
      setFormData({
        name: "",
        title: "",
        body: "",
        category: loadedCategories.length > 0 ? loadedCategories[0].name : ""
      });
    }
  }, [editingTemplate, loadedCategories, open]);

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.title || !formData.body || !formData.category) {
      toast.error("✕ Tüm alanları doldurunuz!");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) throw new Error("User not authenticated");

      if (editingTemplate) {
        // Update
        const { error } = await supabase
          .from("notification_templates")
          .update({
            name: formData.name,
            title: formData.title,
            body: formData.body,
            category: formData.category
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("✓ Şablon başarıyla güncellendi!");
      } else {
        // Insert
        const { error } = await supabase.from("notification_templates").insert({
          name: formData.name,
          title: formData.title,
          body: formData.body,
          category: formData.category,
          admin_id: session.user.id
        });

        if (error) throw error;
        toast.success("✓ Şablon başarıyla oluşturuldu!");
      }

      setFormData({
        name: "",
        title: "",
        body: "",
        category: categories.length > 0 ? categories[0].name : ""
      });
      onOpenChange(false);
      onTemplateSaved?.();
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("✕ Şablon kaydedilirken hata oluştu!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? "Şablonu Düzenle" : "Yeni Şablon Oluştur"}</DialogTitle>
          <DialogDescription>
            {editingTemplate
              ? "Şablon bilgilerini güncelleyin"
              : "Yeni bir bildirim şablonu oluşturun"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Şablon Adı</label>
            <input
              type="text"
              placeholder="Örn: Hoş Geldiniz"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Başlık</label>
            <input
              type="text"
              placeholder="Bildirim başlığı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">İçerik</label>
            <textarea
              placeholder="Bildirim içeriği"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border rounded-md mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md mt-1"
            >
              <option value="">Kategori Seçin</option>
              {loadedCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSaveTemplate}>{editingTemplate ? "Güncelle" : "Oluştur"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
