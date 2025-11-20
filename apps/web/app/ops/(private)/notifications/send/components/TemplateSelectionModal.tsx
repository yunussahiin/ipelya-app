"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Loader2, Check } from "lucide-react";
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
}

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelected: (template: Template) => void;
}

export function TemplateSelectionModal({
  open,
  onOpenChange,
  onTemplateSelected
}: TemplateSelectionModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("notification_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("notification_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (err) {
      console.error("Error loading templates:", err);
      toast.error("✕ Şablonlar yüklenirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  const handleSelect = () => {
    if (!selectedTemplateId) {
      toast.error("✕ Lütfen bir şablon seçiniz!");
      return;
    }

    const selected = templates.find((t) => t.id === selectedTemplateId);
    if (selected) {
      onTemplateSelected(selected);
      setSelectedTemplateId(null);
      setSelectedCategory(null);
      onOpenChange(false);
      toast.success("✓ Şablon başarıyla seçildi!");
    }
  };

  const getCategoryInfo = (categoryName?: string) => {
    return categories.find((c) => c.name === categoryName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bildirim Şablonu Seçin</DialogTitle>
          <DialogDescription>
            Başlık ve içeriği otomatik olarak doldurulacak şablonu seçiniz
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Tümü ({templates.length})
                </Button>
                {categories.map((cat) => {
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

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Henüz şablon yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const categoryInfo = getCategoryInfo(template.category);
                  const isSelected = selectedTemplateId === template.id;

                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{template.name}</p>
                              {categoryInfo && (
                                <span
                                  className={`inline-block text-xs px-2 py-1 rounded mt-1 font-semibold ${categoryInfo.color}`}
                                >
                                  {categoryInfo.label}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="h-5 w-5 text-blue-500 shrink-0" />}
                          </div>

                          {/* Title */}
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Başlık</p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {template.title}
                            </p>
                          </div>

                          {/* Body */}
                          <div>
                            <p className="text-xs text-gray-500 font-medium">İçerik</p>
                            <p className="text-sm text-gray-700 line-clamp-3">{template.body}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button onClick={handleSelect} disabled={!selectedTemplateId}>
                <Check className="h-4 w-4 mr-2" />
                Seç
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
