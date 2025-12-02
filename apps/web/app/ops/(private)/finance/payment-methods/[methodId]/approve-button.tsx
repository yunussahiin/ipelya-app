"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ApproveMethodButtonProps {
  methodId: string;
}

export function ApproveMethodButton({ methodId }: ApproveMethodButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/ops/finance/payment-methods/${methodId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success("✓ Ödeme yöntemi onaylandı");
      router.refresh();
      router.push("/ops/finance/payment-methods");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleApprove} disabled={isLoading}>
      <Check className="h-4 w-4 mr-2" />
      {isLoading ? "Onaylanıyor..." : "Onayla"}
    </Button>
  );
}
