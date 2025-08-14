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

export const CATEGORY_COLORS: Record<string, string> = {
  "その他": "#2196F3",
  "娯楽": "#EB3569", 
  "食費": "#FFC53A",
  "わんちゃん": "#8369FC",
  "医療費": "#10B981",
  "日用品": "#50CFE4",
  "交通費": "#9CA3AF" // グレーを追加
};

export const EMOTIONS = [
  {
    id: "positive",
    label: "😊 ポジティブ",
    color: "#10B981",
    emoji: "😊"
  },
  {
    id: "neutral",
    label: "😐 ニュートラル",
    color: "#6B7280",
    emoji: "😐"
  },
  {
    id: "negative",
    label: "😔 ネガティブ",
    color: "#EF4444",
    emoji: "😔"
  }
] as const;

export type CategoryType = typeof CATEGORIES[number];
export type EmotionType = typeof EMOTIONS[number]["id"];
