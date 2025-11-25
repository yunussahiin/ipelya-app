/**
 * PostDetails Types
 */

import type { MediaAsset, PollData, PostSettings } from "../types";

export interface PostDetailsProps {
  selectedAssets: MediaAsset[];
  onBack: () => void;
  onPublish: (data: { caption: string; poll?: PollData; settings: PostSettings }) => void;
}

export interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export interface MediaPreviewProps {
  assets: MediaAsset[];
}

export interface PollSectionProps {
  pollQuestion: string;
  setPollQuestion: (value: string) => void;
  pollOptions: string[];
  pollDuration: PollData["duration"];
  setPollDuration: (value: PollData["duration"]) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onUpdateOption: (index: number, value: string) => void;
}

export const POLL_DURATIONS: { value: PollData["duration"]; label: string }[] = [
  { value: "1h", label: "1 saat" },
  { value: "6h", label: "6 saat" },
  { value: "24h", label: "24 saat" },
  { value: "3d", label: "3 gün" },
  { value: "7d", label: "7 gün" }
];
