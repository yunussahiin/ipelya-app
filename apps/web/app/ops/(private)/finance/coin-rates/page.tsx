import { Suspense } from "react";
import { Coins, Clock, User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatTL } from "@/components/ops/finance";
import { UpdateRateDialog } from "@/components/ops/finance/coin-rates/update-rate-dialog";

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getCoinRates() {
  const supabase = await createServerSupabaseClient();

  const { data: rates, error } = await supabase
    .from("coin_rates")
    .select(
      `
      id,
      rate,
      effective_from,
      note,
      created_at,
      created_by
    `
    )
    .order("effective_from", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Coin Rates] Error:", error);
    return { rates: [], currentRate: null };
  }

  // Admin bilgilerini al
  const creatorIds = [...new Set(rates?.map((r) => r.created_by).filter(Boolean))];
  const { data: admins } = await supabase
    .from("admin_profiles")
    .select("id, full_name, email")
    .in("id", creatorIds);

  const adminMap = new Map(admins?.map((a) => [a.id, a]));

  const enrichedRates =
    rates?.map((rate) => ({
      ...rate,
      created_by_admin: rate.created_by ? adminMap.get(rate.created_by) : null
    })) || [];

  return {
    rates: enrichedRates,
    currentRate: enrichedRates[0] || null
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

async function CoinRatesContent() {
  const { rates, currentRate } = await getCoinRates();

  return (
    <div className="space-y-6">
      {/* Güncel Kur Kartı */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              <CardTitle>Güncel Kur</CardTitle>
            </div>
            <UpdateRateDialog currentRate={currentRate?.rate || 0.5} />
          </div>
        </CardHeader>
        <CardContent>
          {currentRate ? (
            <div className="space-y-4">
              <div className="text-3xl font-bold">1 🪙 = {formatTL(currentRate.rate)}</div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Son güncelleme: {new Date(currentRate.effective_from).toLocaleString("tr-TR")}
                  </span>
                </div>
                {currentRate.created_by_admin && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>
                      {currentRate.created_by_admin.full_name || currentRate.created_by_admin.email}
                    </span>
                  </div>
                )}
              </div>
              {currentRate.note && (
                <p className="text-sm text-muted-foreground italic">Not: {currentRate.note}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Henüz kur tanımlanmamış</p>
          )}
        </CardContent>
      </Card>

      {/* Önemli Notlar */}
      <Alert>
        <AlertDescription>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li>Kur değişikliği mevcut talepleri ETKİLEMEZ</li>
            <li>Her talep, oluşturulduğu andaki kur ile kilitlenir</li>
            <li>Kur değişikliği sadece yeni talepleri etkiler</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Kur Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle>Kur Geçmişi</CardTitle>
          <CardDescription>Tüm kur değişikliklerinin kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          {rates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kur</TableHead>
                  <TableHead>Güncelleyen</TableHead>
                  <TableHead>Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate, index) => (
                  <TableRow key={rate.id}>
                    <TableCell>{new Date(rate.effective_from).toLocaleString("tr-TR")}</TableCell>
                    <TableCell className="font-medium">
                      {formatTL(rate.rate)}
                      {index > 0 && (
                        <span
                          className={`ml-2 text-xs ${
                            rate.rate > rates[index - 1].rate
                              ? "text-red-500"
                              : rate.rate < rates[index - 1].rate
                                ? "text-green-500"
                                : ""
                          }`}
                        >
                          {rate.rate > rates[index - 1].rate
                            ? "↑"
                            : rate.rate < rates[index - 1].rate
                              ? "↓"
                              : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rate.created_by_admin?.full_name || rate.created_by_admin?.email || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{rate.note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Henüz kur geçmişi yok</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CoinRatesSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64 mt-4" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function CoinRatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kur Yönetimi</h1>
        <p className="text-muted-foreground">Coin/TL dönüşüm kurunu yönetin</p>
      </div>

      <Suspense fallback={<CoinRatesSkeleton />}>
        <CoinRatesContent />
      </Suspense>
    </div>
  );
}
