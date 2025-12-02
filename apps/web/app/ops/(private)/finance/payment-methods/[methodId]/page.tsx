import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Wallet, Check, AlertTriangle, User, Shield } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentMethodStatusBadge, KYCStatusBadge } from "@/components/ops/finance";
import { validateTurkishIBAN, getBankName } from "@/lib/utils/iban";
import { RejectMethodDialog } from "@/components/ops/finance/payment-methods/reject-method-dialog";
import { ApproveMethodButton } from "./approve-button";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ methodId: string }>;
}

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getPaymentMethodDetail(methodId: string) {
  const supabase = await createServerSupabaseClient();

  // Ödeme yöntemi
  const { data: method, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("id", methodId)
    .single();

  if (error || !method) {
    return null;
  }

  // Creator profili
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", method.creator_id)
    .eq("type", "real")
    .single();

  // Auth user (email için)
  const { data: authData } = await supabase.auth.admin.getUserById(method.creator_id);

  // KYC durumu
  const { data: kyc } = await supabase
    .from("creator_kyc_profiles")
    .select("*")
    .eq("creator_id", method.creator_id)
    .single();

  // Diğer yöntem sayısı
  const { count: otherMethodsCount } = await supabase
    .from("payment_methods")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", method.creator_id)
    .neq("id", methodId);

  // Reviewer bilgisi
  let reviewer = null;
  if (method.reviewed_by) {
    const { data: reviewerData } = await supabase
      .from("admin_profiles")
      .select("id, full_name, email")
      .eq("id", method.reviewed_by)
      .single();
    reviewer = reviewerData;
  }

  return {
    method: { ...method, reviewer },
    creator: profile ? { ...profile, email: authData?.user?.email } : null,
    kyc,
    isFirstMethod: (otherMethodsCount || 0) === 0
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function ValidationItem({
  valid,
  label,
  warning
}: {
  valid: boolean;
  label: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {valid ? (
        warning ? (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-500" />
      )}
      <span className={valid ? (warning ? "text-yellow-600" : "") : "text-red-600"}>{label}</span>
    </div>
  );
}

async function PaymentMethodDetailContent({ methodId }: { methodId: string }) {
  const data = await getPaymentMethodDetail(methodId);

  if (!data) {
    notFound();
  }

  const { method, creator, kyc, isFirstMethod } = data;
  const isPending = method.status === "pending";

  // IBAN Mod97 validasyonu
  const ibanValidation =
    method.type === "bank" && method.iban ? validateTurkishIBAN(method.iban) : { valid: true };
  const isIBANValid = ibanValidation.valid;
  const bankName =
    method.type === "bank" && ibanValidation.bankCode ? getBankName(ibanValidation.bankCode) : null;

  // İsim uyumu kontrolü (basit - KYC ile karşılaştır)
  const isNameMatch =
    method.type === "bank" && kyc?.verified_name
      ? method.account_holder?.toUpperCase().includes(kyc.verified_name.split(" ")[0].toUpperCase())
      : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/finance/payment-methods">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Ödeme Yöntemi Detayı</h1>
            <p className="text-sm text-muted-foreground">
              {method.type === "bank" ? "Banka Hesabı" : "Kripto Cüzdanı"}
            </p>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-2">
            <RejectMethodDialog
              methodId={method.id}
              creatorUsername={creator?.username || "unknown"}
              methodType={method.type}
            />
            <ApproveMethodButton methodId={method.id} />
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sol Kolon */}
        <div className="space-y-6">
          {/* Creator Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Creator Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creator?.avatar_url || undefined} />
                  <AvatarFallback>{creator?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{creator?.username}</p>
                  <p className="text-sm text-muted-foreground">{creator?.email}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">KYC Durumu</span>
                {kyc ? (
                  <KYCStatusBadge status={kyc.status} level={kyc.level} />
                ) : (
                  <Badge variant="outline">Başvuru Yok</Badge>
                )}
              </div>

              {kyc?.verified_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kayıtlı Adı</span>
                  <span className="font-medium">{kyc.verified_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hesap Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {method.type === "bank" ? (
                  <Building2 className="h-5 w-5 text-blue-500" />
                ) : (
                  <Wallet className="h-5 w-5 text-purple-500" />
                )}
                {method.type === "bank" ? "Banka Hesabı Bilgileri" : "Kripto Cüzdanı Bilgileri"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {method.type === "bank" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banka</span>
                    <span className="font-medium">{method.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono text-sm">{method.iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hesap Sahibi</span>
                    <span className="font-medium">{method.account_holder}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ağ</span>
                    <span className="font-medium">{method.crypto_network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cüzdan Adresi</span>
                    <span className="font-mono text-sm break-all">{method.wallet_address}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between">
                <span className="text-muted-foreground">Varsayılan</span>
                <span>{method.is_default ? "Evet" : "Hayır"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eklenme</span>
                <span>{new Date(method.created_at).toLocaleString("tr-TR")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Red Bilgisi */}
          {method.status === "rejected" && method.rejection_reason && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Reddedilme Sebebi:</strong> {method.rejection_reason}
                {method.reviewer && (
                  <p className="text-xs mt-1">
                    {method.reviewer.full_name || method.reviewer.email} -{" "}
                    {new Date(method.reviewed_at).toLocaleString("tr-TR")}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-6">
          {/* Doğrulama Kontrolleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Doğrulama Kontrolleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {method.type === "bank" ? (
                <>
                  <ValidationItem
                    valid={isIBANValid}
                    label={
                      isIBANValid
                        ? `IBAN geçerli${bankName ? ` (${bankName})` : ""}`
                        : `IBAN hatalı: ${ibanValidation.error || "Geçersiz format"}`
                    }
                  />
                  <ValidationItem
                    valid={isNameMatch}
                    label={
                      isNameMatch
                        ? "Hesap sahibi adı KYC ile uyumlu"
                        : "Hesap sahibi adı KYC ile uyuşmuyor"
                    }
                  />
                </>
              ) : (
                <ValidationItem
                  valid={method.wallet_address?.length > 20}
                  label="Cüzdan adresi formatı geçerli"
                />
              )}

              <ValidationItem
                valid={!isFirstMethod}
                label={isFirstMethod ? "İlk kez ödeme yöntemi ekliyor" : "Daha önce yöntem eklemiş"}
                warning={isFirstMethod}
              />

              <ValidationItem
                valid={kyc?.status === "approved"}
                label={
                  kyc?.status === "approved"
                    ? "KYC doğrulaması tamamlanmış"
                    : "KYC doğrulaması eksik"
                }
              />
            </CardContent>
          </Card>

          {/* Durum */}
          <Card>
            <CardHeader>
              <CardTitle>Durum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <PaymentMethodStatusBadge status={method.status} />
                {method.reviewed_at && (
                  <span className="text-sm text-muted-foreground">
                    {new Date(method.reviewed_at).toLocaleString("tr-TR")}
                  </span>
                )}
              </div>
              {method.reviewer && (
                <p className="text-sm text-muted-foreground mt-2">
                  İşleyen: {method.reviewer.full_name || method.reviewer.email}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function PaymentMethodDetailPage({ params }: PageProps) {
  const { methodId } = await params;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PaymentMethodDetailContent methodId={methodId} />
    </Suspense>
  );
}
