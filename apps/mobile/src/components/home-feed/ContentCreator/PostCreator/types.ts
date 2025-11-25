/**
 * PostCreator Types
 */

export interface MediaAsset {
  id: string;
  uri: string;
  mediaType: "photo" | "video";
  width: number;
  height: number;
  duration?: number;
}

export interface PollData {
  question: string;
  options: string[];
  duration: "1h" | "6h" | "24h" | "3d" | "7d";
}

export interface PostSettings {
  hideComments: boolean;
  hideLikes: boolean;
  hideShareCount: boolean;
  audience: "followers" | "close_friends";
}

export type PostStep = "media" | "details";
