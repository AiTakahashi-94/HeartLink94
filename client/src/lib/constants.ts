import { Smile, Check, Frown, Star, AlertTriangle, ThumbsUp } from "lucide-react";

export const CATEGORIES = [
  "食費",
  "交通費",
  "娯楽",
  "日用品",
  "医療費",
  "衣類",
  "その他"
] as const;

export const EMOTIONS = [
  {
    id: "happy",
    label: "嬉しい",
    color: "#10B981",
    icon: Smile
  },
  {
    id: "necessary",
    label: "必要",
    color: "#6B7280",
    icon: Check
  },
  {
    id: "guilty",
    label: "罪悪感",
    color: "#EF4444",
    icon: Frown
  },
  {
    id: "excited",
    label: "興奮",
    color: "#8B5CF6",
    icon: Star
  },
  {
    id: "worried",
    label: "心配",
    color: "#F59E0B",
    icon: AlertTriangle
  },
  {
    id: "satisfied",
    label: "満足",
    color: "#06B6D4",
    icon: ThumbsUp
  }
] as const;

export type CategoryType = typeof CATEGORIES[number];
export type EmotionType = typeof EMOTIONS[number]["id"];
