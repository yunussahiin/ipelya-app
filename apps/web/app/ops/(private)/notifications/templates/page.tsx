"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  title: string;
  body: string;
  category?: string;
  created_at: string;
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    body: "",
    category: "announcement"
  });

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const handleSaveTemplate = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("notification_templates").insert({
        name: formData.name,
        title: formData.title,
        body: formData.body,
        category: formData.category
      });

      if (error) throw error;

      setFormData({ name: "", title: "", body: "", category: "announcement" });
      setShowForm(false);
      loadTemplates();
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Şablon kaydedilirken hata oluştu");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("notification_templates").delete().eq("id", id);

      if (error) throw error;
      loadTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Şablon silinirken hata oluştu");
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
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Şablon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Şablon Oluştur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <option value="announcement">Duyuru</option>
                <option value="maintenance">Bakım</option>
                <option value="security">Güvenlik</option>
                <option value="promotional">Promosyon</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} className="flex-1">
                Kaydet
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Henüz şablon yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.category}</CardDescription>
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
                  <Button variant="outline" size="sm" className="flex-1">
                    Kullan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
