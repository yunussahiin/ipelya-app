/**
 * FeedGrid Component
 * Feed kartlarını grid layout'ta gösterir
 */

import type { FeedItem } from "../types";
import { MiniPostCard } from "./mini-post-card";
import { PollCard } from "./poll-card";
import { PostCard } from "./post-card";
import { VoiceMomentCard } from "./voice-moment-card";

interface FeedGridProps {
  items: FeedItem[];
  columns: number;
  onItemClick: (item: FeedItem) => void;
  onModerate: (item: FeedItem) => void;
}

export function FeedGrid({ items, columns, onItemClick, onModerate }: FeedGridProps) {
  const gridCols =
    {
      1: "grid-cols-1 max-w-2xl mx-auto",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  const renderCard = (item: FeedItem) => {
    switch (item.content_type) {
      case "post":
        return (
          <PostCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onModerate={() => onModerate(item)}
          />
        );
      case "mini_post":
        return (
          <MiniPostCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onModerate={() => onModerate(item)}
          />
        );
      case "poll":
        return (
          <PollCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onModerate={() => onModerate(item)}
          />
        );
      case "voice_moment":
        return (
          <VoiceMomentCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onModerate={() => onModerate(item)}
          />
        );
      default:
        return null;
    }
  };

  return <div className={`grid gap-6 ${gridCols}`}>{items.map(renderCard)}</div>;
}
