"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Server, RefreshCw, ExternalLink, Shield, FileText, Activity } from "lucide-react";

interface Provider {
  name: string;
  slug: string;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  status_page_url: string | null;
}

export function ProvidersSection() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/ai/providers");
      if (!response.ok) {
        throw new Error("Failed to fetch providers");
      }
      const result = await response.json();
      setProviders(result.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProviders}>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Provider
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Privacy Policy
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter((p) => p.privacy_policy_url).length}
            </div>
            <p className="text-xs text-muted-foreground">provider ile mevcut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Page</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter((p) => p.status_page_url).length}
            </div>
            <p className="text-xs text-muted-foreground">provider ile mevcut</p>
          </CardContent>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                OpenRouter Providers
              </CardTitle>
              <CardDescription>Kullanılabilir AI model sağlayıcıları</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProviders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {providers.length > 0 ? (
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-center">Linkler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.slug}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {provider.slug}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {provider.privacy_policy_url && (
                            <a
                              href={provider.privacy_policy_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="Privacy Policy"
                            >
                              <Shield className="h-4 w-4" />
                            </a>
                          )}
                          {provider.terms_of_service_url && (
                            <a
                              href={provider.terms_of_service_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="Terms of Service"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          {provider.status_page_url && (
                            <a
                              href={provider.status_page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="Status Page"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {!provider.privacy_policy_url &&
                            !provider.terms_of_service_url &&
                            !provider.status_page_url && (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Provider Bulunamadı</h3>
              <p className="text-sm text-muted-foreground">
                OpenRouter&apos;dan provider listesi alınamadı.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
