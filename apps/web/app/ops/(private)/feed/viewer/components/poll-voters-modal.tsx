/**
 * PollVotersModal Component
 * Ankete kim oy verdi modalı
 * Mobil PollVotersSheet ile aynı özellikler
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { IconUsers, IconX } from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { FeedItem, PollVoter } from "../types";

interface PollVotersModalProps {
  item: FeedItem | null;
  open: boolean;
  onClose: () => void;
}

export function PollVotersModal({ item, open, onClose }: PollVotersModalProps) {
  const [loading, setLoading] = useState(false);
  const [voters, setVoters] = useState<PollVoter[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const fetchVoters = useCallback(
    async (optionId?: string) => {
      if (!item) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("poll_id", item.content.id);
        if (optionId) params.set("option_id", optionId);

        const response = await fetch(`/api/ops/feed/poll-voters?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setVoters(data.data.voters);
        }
      } catch (error) {
        console.error("Poll voters fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [item]
  );

  useEffect(() => {
    if (open && item) {
      fetchVoters(selectedOption || undefined);
    } else {
      setVoters([]);
      setSelectedOption(null);
    }
  }, [open, item, selectedOption, fetchVoters]);

  if (!item || item.content_type !== "poll") return null;

  const totalVotes = item.content.total_votes || 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconUsers className="h-5 w-5 text-primary" />
              <DialogTitle>Anket Sonuçları</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Question */}
        <p className="font-medium">{item.content.question}</p>

        {/* Options Summary */}
        <div className="space-y-3">
          {item.content.options?.map((option) => {
            const percentage =
              totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{option.option_text}</span>
                  <span className="text-muted-foreground">
                    {option.votes_count} oy ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <Tabs
          value={selectedOption || "all"}
          onValueChange={(v) => setSelectedOption(v === "all" ? null : v)}
        >
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="flex-1">
              Tümü ({totalVotes})
            </TabsTrigger>
            {item.content.options?.map((option) => (
              <TabsTrigger key={option.id} value={option.id} className="flex-1">
                {option.option_text} ({option.votes_count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedOption || "all"} className="mt-4">
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : voters.length > 0 ? (
                <div className="space-y-3">
                  {voters.map((voter) => (
                    <div key={voter.id} className="flex items-center gap-3 rounded-lg border p-3">
                      {voter.user.avatar_url ? (
                        <Image
                          src={voter.user.avatar_url}
                          alt={voter.user.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <span className="text-sm font-medium">
                            {voter.user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {voter.user.display_name || voter.user.username}
                        </p>
                        <p className="text-sm text-muted-foreground">@{voter.user.username}</p>
                      </div>
                      <Badge variant="secondary">{voter.option.option_text}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <IconUsers className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Henüz oy verilmemiş</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
