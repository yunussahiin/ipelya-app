import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UnifiedConversationsClient } from "./unified-client";

export default async function ConversationsPage() {
  const supabase = await createServerSupabaseClient();

  console.log("[DM Conversations] Starting to load page data...");

  // İstatistikler
  const { count: totalConversations, error: totalError } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true });

  console.log(
    "[DM Conversations] Total conversations:",
    totalConversations,
    "Error:",
    totalError?.message || "none"
  );

  const { count: directConversations, error: directError } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("type", "direct");

  console.log(
    "[DM Conversations] Direct conversations:",
    directConversations,
    "Error:",
    directError?.message || "none"
  );

  const { count: groupConversations, error: groupError } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("type", "group");

  console.log(
    "[DM Conversations] Group conversations:",
    groupConversations,
    "Error:",
    groupError?.message || "none"
  );

  // Son sohbetleri getir
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select(
      `
      id,
      type,
      name,
      avatar_url,
      last_message_at,
      created_at,
      is_archived
    `
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  console.log(
    "[DM Conversations] Loaded:",
    conversations?.length || 0,
    "Error:",
    convError?.message || "none"
  );

  // Katılımcı bilgilerini al
  const conversationIds = conversations?.map((c) => c.id) || [];

  const participantsData: Record<
    string,
    Array<{
      user_id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
      gender?: "male" | "female" | "other" | null;
      is_creator?: boolean;
    }>
  > = {};

  if (conversationIds.length > 0) {
    // Katılımcıları getir
    const { data: participantsList } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds)
      .is("left_at", null);

    // User ID'lerini topla
    const userIds = new Set(participantsList?.map((p) => p.user_id) || []);

    // Profilleri getir
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username, gender, is_creator")
      .in("user_id", Array.from(userIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Katılımcıları profil bilgisiyle zenginleştir
    const participants = participantsList?.map((p) => ({
      ...p,
      profile: profileMap.get(p.user_id)
    }));

    // Katılımcıları conversation_id'ye göre grupla
    participants?.forEach((p) => {
      if (!participantsData[p.conversation_id]) {
        participantsData[p.conversation_id] = [];
      }
      const profile = p.profile as unknown as {
        display_name: string | null;
        avatar_url: string | null;
        username: string | null;
        gender?: "male" | "female" | "other" | null;
        is_creator?: boolean;
      } | null;
      participantsData[p.conversation_id].push({
        user_id: p.user_id,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        username: profile?.username || null,
        gender: profile?.gender || null,
        is_creator: profile?.is_creator || false
      });
    });
  }

  // Conversations'ları zenginleştir
  const enrichedConversations =
    conversations?.map((conv) => ({
      ...conv,
      participants: participantsData[conv.id] || []
    })) || [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DM Sohbetleri</h1>
        <p className="text-muted-foreground">Kullanıcı mesajlaşmalarını görüntüleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Sohbet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Birebir Sohbet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{directConversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grup Sohbeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupConversations || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Conversations Client */}
      <Suspense fallback={<div className="text-muted-foreground">Yükleniyor...</div>}>
        <UnifiedConversationsClient conversations={enrichedConversations} />
      </Suspense>
    </div>
  );
}
