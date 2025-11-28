/**
 * Feed Viewer Sayfası - Gelişmiş Versiyon
 *
 * Amaç: Instagram tarzı feed görüntüleme - mobil ile aynı özellikler
 *
 * Özellikler:
 * - Mobil ile aynı kart stilleri (PostCard, MiniPostCard, PollCard, VoiceMomentCard)
 * - Grid layout seçenekleri (1, 2, 3, 4, 5 sütun)
 * - Post detay modal (yorumlar, beğenenler)
 * - Poll voters modal (kim oy verdi)
 * - Skeleton loading
 * - Filtreleme (content_type, status)
 * - Infinite scroll
 *
 * Edge Functions:
 * - ops-get-feed (admin için özel)
 * - get-post-details (yorumlar dahil)
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconChartBar,
  IconColumns1,
  IconColumns2,
  IconColumns3,
  IconFilter,
  IconGridDots,
  IconLayoutGrid,
  IconMessageCircle,
  IconMicrophone,
  IconPhoto,
  IconRefresh
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  FeedGrid,
  FeedSkeleton,
  ModerationDialog,
  PollVotersModal,
  PostDetailModal
} from "./components";
import type { FeedItem } from "./types";

export default function FeedViewerPage() {
  // State
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [contentType, setContentType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [columns, setColumns] = useState<string>("3");

  // Client-side localStorage okuma (hydration hatası önleme)
  useEffect(() => {
    const saved = localStorage.getItem("feed-viewer-columns");
    if (saved) setColumns(saved);
  }, []);

  // Infinite scroll ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<FeedItem | null>(null);
  const [moderationItem, setModerationItem] = useState<FeedItem | null>(null);

  // Feed'i getir
  const fetchFeed = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setItems([]);
        setCursor(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", "20");

        if (!reset && cursor) {
          params.set("cursor", cursor);
        }

        if (contentType !== "all") {
          params.set("content_type", contentType);
        }

        if (status !== "all") {
          params.set("status", status);
        }

        const response = await fetch(`/api/ops/feed/viewer?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          if (reset) {
            setItems(data.data.items);
          } else {
            setItems((prev) => [...prev, ...data.data.items]);
          }
          setCursor(data.data.next_cursor);
          setHasMore(data.data.has_more);
        }
      } catch (error) {
        console.error("Feed fetch error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor, contentType, status]
  );

  // İlk yükleme ve filtre değişikliğinde
  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, status]);

  // Columns değiştiğinde localStorage'a kaydet
  const handleColumnsChange = (value: string) => {
    if (value) {
      setColumns(value);
      localStorage.setItem("feed-viewer-columns", value);
    }
  };

  // Infinite scroll - IntersectionObserver
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchFeed(false);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading, hasMore, loadingMore, fetchFeed]);

  // Post detay modal aç
  const handlePostClick = (item: FeedItem) => {
    if (item.content_type === "poll") {
      setSelectedPoll(item);
    } else {
      setSelectedPost(item);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feed Viewer</h1>
          <p className="text-muted-foreground">
            Tüm feed içeriklerini mobil ile aynı görünümde inceleyin
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchFeed(true)} disabled={loading}>
          <IconRefresh className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Filters & Layout */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <IconFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtreler:</span>
          </div>

          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="İçerik Türü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="post">
                <span className="flex items-center gap-2">
                  <IconPhoto className="h-4 w-4" /> Post
                </span>
              </SelectItem>
              <SelectItem value="mini_post">
                <span className="flex items-center gap-2">
                  <IconMessageCircle className="h-4 w-4" /> Vibe
                </span>
              </SelectItem>
              <SelectItem value="poll">
                <span className="flex items-center gap-2">
                  <IconChartBar className="h-4 w-4" /> Anket
                </span>
              </SelectItem>
              <SelectItem value="voice_moment">
                <span className="flex items-center gap-2">
                  <IconMicrophone className="h-4 w-4" /> Ses
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="visible">Görünür</SelectItem>
              <SelectItem value="hidden">Gizli</SelectItem>
              <SelectItem value="flagged">İşaretli</SelectItem>
            </SelectContent>
          </Select>

          {/* Layout Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Görünüm:</span>
            <ToggleGroup type="single" value={columns} onValueChange={handleColumnsChange}>
              <ToggleGroupItem value="1" aria-label="1 sütun">
                <IconColumns1 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="2" aria-label="2 sütun">
                <IconColumns2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="3" aria-label="3 sütun">
                <IconColumns3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="4" aria-label="4 sütun">
                <IconLayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="5" aria-label="5 sütun">
                <IconGridDots className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Badge variant="secondary">{items.length} içerik</Badge>
        </CardContent>
      </Card>

      {/* Feed Content */}
      {loading ? (
        <FeedSkeleton columns={parseInt(columns)} />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconPhoto className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">İçerik bulunamadı</h3>
            <p className="text-sm text-muted-foreground">Filtreleri değiştirmeyi deneyin</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <FeedGrid
            items={items}
            columns={parseInt(columns)}
            onItemClick={handlePostClick}
            onModerate={setModerationItem}
          />
          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Yükleniyor...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Post Detail Modal */}
      <PostDetailModal
        item={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      {/* Poll Voters Modal */}
      <PollVotersModal
        item={selectedPoll}
        open={!!selectedPoll}
        onClose={() => setSelectedPoll(null)}
      />

      {/* Moderation Dialog */}
      {moderationItem && (
        <ModerationDialog
          open={!!moderationItem}
          onClose={() => setModerationItem(null)}
          targetType={moderationItem.content_type as "post" | "mini_post" | "poll" | "voice_moment"}
          targetId={moderationItem.content.id}
          currentStatus={moderationItem.is_hidden ? "hidden" : "visible"}
          onSuccess={() => fetchFeed(true)}
        />
      )}
    </>
  );
}
