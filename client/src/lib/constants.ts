import { Smile, Check, Frown, Star, AlertTriangle, ThumbsUp } from "lucide-react";

export const CATEGORIES = [
  "食費",
  "交通費",
  "娯楽",
  "日用品",
  "医療費",
  "わんちゃん",
  "その他"
] as const;

export const EMOTIONS = [
  {
    id: "positive",
    label: "ポジティブ",
    color: "#10B981",
    emoji: "😊"
  },
  {
    id: "neutral",
    label: "ニュートラル",
    color: "#6B7280",
    emoji: "😐"
  },
  {
    id: "negative",
    label: "ネガティブ",
    color: "#EF4444",
    emoji: "😔"
  }
] as const;

export type CategoryType = typeof CATEGORIES[number];
export type EmotionType = typeof EMOTIONS[number]["id"];
