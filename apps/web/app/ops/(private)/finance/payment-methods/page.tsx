import { Suspense } from "react";
import Link from "next/link";
import { CreditCard, Building2, Wallet, Clock, Check, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentMethodStatusBadge } from "@/components/ops/finance";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  creator_id: string;
  type: "bank" | "crypto";
  status: "pending" | "approved" | "rejected";
  bank_name?: string;
  iban?: string;
  account_holder?: string;
  crypto_network?: string;
  wallet_address?: string;
  created_at: string;
  creator?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getPaymentMethods() {
  const supabase = await createServerSupabaseClient();

  const { data: methods, error } = await supabase
    .from("payment_methods")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Payment Methods] Error:", error);
    return { methods: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0 } };
  }

  // Creator profilleri
  const creatorIds = [...new Set(methods?.map((m) => m.creator_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", creatorIds)
    .eq("type", "real");

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  const enrichedMethods = methods?.map((method) => ({
    ...method,
    creator: profileMap.get(method.creator_id)
  }));

  const counts = {
    all: methods?.length || 0,
    pending: methods?.filter((m) => m.status === "pending").length || 0,
    approved: methods?.filter((m) => m.status === "approved").length || 0,
    rejected: methods?.filter((m) => m.status === "rejected").length || 0
  };

  return { methods: enrichedMethods || [], counts };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function MethodTypeIcon({ type }: { type: "bank" | "crypto" }) {
  if (type === "bank") {
    return <Building2 className="h-4 w-4 text-blue-500" />;
  }
  return <Wallet className="h-4 w-4 text-purple-500" />;
}

function formatIBAN(iban: string) {
  // Son 4 hane görünür
  return `****${iban.slice(-4)}`;
}

function formatWallet(address: string) {
  // İlk 6 ve son 4 hane
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function PaymentMethodsTable({ methods }: { methods: PaymentMethod[] }) {
  if (methods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">Bu kategoride ödeme yöntemi yok</div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Creator</TableHead>
          <TableHead>Tip</TableHead>
          <TableHead>Detay</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {methods.map((method) => (
          <TableRow key={method.id}>
            <TableCell>
              <Link
                href={`/ops/finance/payment-methods/${method.id}`}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={method.creator?.avatar_url || undefined} />
                  <AvatarFallback>
                    {method.creator?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">@{method.creator?.username || "unknown"}</span>
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <MethodTypeIcon type={method.type} />
                {method.type === "bank" ? "Banka" : "Kripto"}
              </div>
            </TableCell>
            <TableCell>
              {method.type === "bank" ? (
                <span>
                  {method.bank_name} {formatIBAN(method.iban || "")}
                </span>
              ) : (
                <span>
                  {method.crypto_network} {formatWallet(method.wallet_address || "")}
                </span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(method.created_at).toLocaleDateString("tr-TR")}
            </TableCell>
            <TableCell>
              <PaymentMethodStatusBadge status={method.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function PaymentMethodsContent() {
  const { methods, counts } = await getPaymentMethods();

  const pending = methods.filter((m) => m.status === "pending");
  const approved = methods.filter((m) => m.status === "approved");
  const rejected = methods.filter((m) => m.status === "rejected");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Yöntemleri</CardTitle>
        <CardDescription>Banka ve kripto hesap onayları</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              Tümü
              <Badge variant="secondary">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-3 w-3" />
              Bekleyen
              {counts.pending > 0 && <Badge variant="destructive">{counts.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check className="h-3 w-3" />
              Onaylı
              <Badge variant="secondary">{counts.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <X className="h-3 w-3" />
              Reddedilmiş
              <Badge variant="secondary">{counts.rejected}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <PaymentMethodsTable methods={methods} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <PaymentMethodsTable methods={pending} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <PaymentMethodsTable methods={approved} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <PaymentMethodsTable methods={rejected} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PaymentMethodsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-80 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ödeme Yöntemi Onayları</h1>
        <p className="text-muted-foreground">Banka ve kripto hesap onay işlemleri</p>
      </div>

      <Suspense fallback={<PaymentMethodsSkeleton />}>
        <PaymentMethodsContent />
      </Suspense>
    </div>
  );
}
