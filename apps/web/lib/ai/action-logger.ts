/**
 * AI Action Logger
 * AI tool'larının yaptığı işlemleri loglar ve geri alma imkanı sağlar
 */

import { createAdminSupabaseClient } from "@/lib/supabase/server";

export interface ActionLogInput {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  adminId: string;
  adminUsername?: string;
  targetType?: "user" | "post" | "report" | "coin" | "notification" | "other";
  targetId?: string;
  targetUsername?: string;
  status?: "completed" | "failed";
  errorMessage?: string;
  isReversible?: boolean;
  revertData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ActionLog {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown> | null;
  admin_id: string;
  admin_username: string | null;
  target_type: string | null;
  target_id: string | null;
  target_username: string | null;
  status: "completed" | "failed" | "reverted";
  error_message: string | null;
  is_reversible: boolean;
  revert_data: Record<string, unknown> | null;
  reverted_at: string | null;
  reverted_by: string | null;
  revert_reason: string | null;
  created_at: string;
}

// Geri alınabilir tool'lar ve geri alma fonksiyonları
const REVERSIBLE_TOOLS: Record<string, {
  getRevertData: (input: Record<string, unknown>, output: Record<string, unknown>) => Record<string, unknown>;
  revert: (revertData: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
}> = {
  banUser: {
    getRevertData: (input) => ({
      userId: input.userId,
      action: "unban",
    }),
    revert: async (data) => {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase
        .from("user_bans")
        .delete()
        .eq("user_id", data.userId);
      return {
        success: !error,
        message: error ? `Geri alma başarısız: ${error.message}` : "Ban kaldırıldı",
      };
    },
  },
  hidePost: {
    getRevertData: (input) => ({
      postId: input.postId,
      action: "unhide",
    }),
    revert: async (data) => {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase
        .from("posts")
        .update({ is_hidden: false })
        .eq("id", data.postId);
      return {
        success: !error,
        message: error ? `Geri alma başarısız: ${error.message}` : "Post görünür yapıldı",
      };
    },
  },
  approvePost: {
    getRevertData: (input, output) => ({
      postId: input.postId,
      previousStatus: output.previousStatus || "pending",
    }),
    revert: async (data) => {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase
        .from("posts")
        .update({ moderation_status: data.previousStatus })
        .eq("id", data.postId);
      return {
        success: !error,
        message: error ? `Geri alma başarısız: ${error.message}` : "Post durumu geri alındı",
      };
    },
  },
  rejectPost: {
    getRevertData: (input, output) => ({
      postId: input.postId,
      previousStatus: output.previousStatus || "pending",
    }),
    revert: async (data) => {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase
        .from("posts")
        .update({ moderation_status: data.previousStatus, is_hidden: false })
        .eq("id", data.postId);
      return {
        success: !error,
        message: error ? `Geri alma başarısız: ${error.message}` : "Post durumu geri alındı",
      };
    },
  },
  adjustCoinBalance: {
    getRevertData: (input) => ({
      userId: input.userId,
      amount: -(input.amount as number), // Ters işlem
      reason: "Geri alma işlemi",
    }),
    revert: async (data) => {
      const supabase = createAdminSupabaseClient();
      
      // Mevcut bakiyeyi al
      const { data: balance } = await supabase
        .from("coin_balances")
        .select("balance")
        .eq("user_id", data.userId)
        .single();
      
      const currentBalance = balance?.balance || 0;
      const newBalance = currentBalance + (data.amount as number);
      
      const { error } = await supabase
        .from("coin_balances")
        .update({ balance: newBalance })
        .eq("user_id", data.userId);
      
      if (!error) {
        // Transaction kaydı
        await supabase.from("coin_transactions").insert({
          user_id: data.userId,
          type: "admin_revert",
          amount: Math.abs(data.amount as number),
          balance_after: newBalance,
          description: data.reason,
        });
      }
      
      return {
        success: !error,
        message: error ? `Geri alma başarısız: ${error.message}` : "Coin işlemi geri alındı",
      };
    },
  },
  verifyUser: {
    getRevertData: (input, output) => ({
      userId: input.userId,
      verified: !(output.verified as boolean),
    }),
    revert: async (data) => {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: data.verified })
        .eq("user_id", data.userId);
      return {
        success: !error,
        message: error ? `Geri alma başarısız: ${error.message}` : "Doğrulama durumu geri alındı",
      };
    },
  },
};

/**
 * AI işlemini logla
 */
export async function logAIAction(input: ActionLogInput): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  
  // Geri alınabilir mi kontrol et
  const reversibleConfig = REVERSIBLE_TOOLS[input.toolName];
  let revertData: Record<string, unknown> | null = null;
  
  if (reversibleConfig && input.toolOutput && input.status !== "failed") {
    revertData = reversibleConfig.getRevertData(input.toolInput, input.toolOutput);
  }
  
  const { data, error } = await supabase
    .from("ai_action_logs")
    .insert({
      tool_name: input.toolName,
      tool_input: input.toolInput,
      tool_output: input.toolOutput || null,
      admin_id: input.adminId,
      admin_username: input.adminUsername || null,
      target_type: input.targetType || null,
      target_id: input.targetId || null,
      target_username: input.targetUsername || null,
      status: input.status || "completed",
      error_message: input.errorMessage || null,
      is_reversible: !!reversibleConfig && input.status !== "failed",
      revert_data: revertData,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      session_id: input.sessionId || null,
    })
    .select("id")
    .single();
  
  if (error) {
    console.error("AI action log error:", error);
    return null;
  }
  
  return data?.id || null;
}

/**
 * İşlemi geri al
 */
export async function revertAIAction(
  logId: string,
  revertedBy: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createAdminSupabaseClient();
  
  // Log'u al
  const { data: log, error: fetchError } = await supabase
    .from("ai_action_logs")
    .select("*")
    .eq("id", logId)
    .single();
  
  if (fetchError || !log) {
    return { success: false, message: "Log bulunamadı" };
  }
  
  if (log.status === "reverted") {
    return { success: false, message: "Bu işlem zaten geri alınmış" };
  }
  
  if (!log.is_reversible) {
    return { success: false, message: "Bu işlem geri alınamaz" };
  }
  
  const reversibleConfig = REVERSIBLE_TOOLS[log.tool_name];
  if (!reversibleConfig) {
    return { success: false, message: "Geri alma fonksiyonu bulunamadı" };
  }
  
  // Geri alma işlemini yap
  const result = await reversibleConfig.revert(log.revert_data);
  
  if (result.success) {
    // Log'u güncelle
    await supabase
      .from("ai_action_logs")
      .update({
        status: "reverted",
        reverted_at: new Date().toISOString(),
        reverted_by: revertedBy,
        revert_reason: reason,
      })
      .eq("id", logId);
  }
  
  return result;
}

/**
 * AI işlem loglarını getir
 */
export async function getAIActionLogs(options?: {
  limit?: number;
  offset?: number;
  toolName?: string;
  status?: string;
  targetType?: string;
  adminId?: string;
}): Promise<{ logs: ActionLog[]; total: number }> {
  const supabase = createAdminSupabaseClient();
  
  let query = supabase
    .from("ai_action_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  
  if (options?.toolName) {
    query = query.eq("tool_name", options.toolName);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.targetType) {
    query = query.eq("target_type", options.targetType);
  }
  if (options?.adminId) {
    query = query.eq("admin_id", options.adminId);
  }
  
  query = query.range(
    options?.offset || 0,
    (options?.offset || 0) + (options?.limit || 50) - 1
  );
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error("Get AI action logs error:", error);
    return { logs: [], total: 0 };
  }
  
  return { logs: data || [], total: count || 0 };
}

/**
 * Tool adından hedef tipini çıkar
 */
export function getTargetTypeFromTool(toolName: string): ActionLogInput["targetType"] {
  if (toolName.includes("User") || toolName.includes("ban") || toolName.includes("verify")) {
    return "user";
  }
  if (toolName.includes("Post") || toolName.includes("post")) {
    return "post";
  }
  if (toolName.includes("Report") || toolName.includes("report")) {
    return "report";
  }
  if (toolName.includes("Coin") || toolName.includes("Balance") || toolName.includes("Transaction")) {
    return "coin";
  }
  if (toolName.includes("Notification") || toolName.includes("notification")) {
    return "notification";
  }
  return "other";
}
