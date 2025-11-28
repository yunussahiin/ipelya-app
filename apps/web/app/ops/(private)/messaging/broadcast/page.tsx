import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BroadcastChannelsClient } from "./broadcast-channels-client";

export default async function BroadcastPage() {
  const supabase = await createServerSupabaseClient();

  // İstatistikler
  const { count: totalChannels } = await supabase
    .from("broadcast_channels")
    .select("*", { count: "exact", head: true });

  const { count: publicChannels } = await supabase
    .from("broadcast_channels")
    .select("*", { count: "exact", head: true })
    .eq("access_type", "public");

  const { count: subscriberChannels } = await supabase
    .from("broadcast_channels")
    .select("*", { count: "exact", head: true })
    .eq("access_type", "subscribers_only");

  const { count: totalMembers } = await supabase
    .from("broadcast_channel_members")
    .select("*", { count: "exact", head: true })
    .is("left_at", null);

  // Kanalları getir
  const { data: channels } = await supabase
    .from("broadcast_channels")
    .select(
      `
      id,
      name,
      description,
      avatar_url,
      cover_url,
      access_type,
      member_count,
      message_count,
      is_active,
      created_at,
      creator_id
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Creator bilgilerini al
  const creatorIds = [...new Set(channels?.map((c) => c.creator_id).filter(Boolean) || [])];

  const creatorsData: Record<
    string,
    {
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    }
  > = {};

  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", creatorIds)
      .eq("type", "real");

    creators?.forEach((c) => {
      creatorsData[c.user_id] = {
        display_name: c.display_name,
        username: c.username,
        avatar_url: c.avatar_url
      };
    });
  }

  // Kanalları zenginleştir
  const enrichedChannels =
    channels?.map((channel) => ({
      ...channel,
      creator: channel.creator_id ? creatorsData[channel.creator_id] || null : null
    })) || [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcast Kanalları</h1>
        <p className="text-muted-foreground">Creator yayın kanallarını görüntüleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Kanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChannels || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Herkese Açık
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicChannels || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abonelere Özel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberChannels || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Üye</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Channels List */}
      <Suspense fallback={<div className="text-muted-foreground">Yükleniyor...</div>}>
        <BroadcastChannelsClient channels={enrichedChannels} />
      </Suspense>
    </div>
  );
}
