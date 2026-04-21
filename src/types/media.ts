export type MediaKind = "quran_video" | "islamic_design" | "chroma" | "nature_scene" | "other";

export interface MediaItem {
  id: string;
  slug: string;
  title_ar: string;
  description_ar: string;
  media_kind: MediaKind;
  category: string;
  reciter?: string;
  surah?: string;
  duration_seconds: number;
  tags: string[];
  resolution: string;
  file_type: string;
  video_url: string;
  thumbnail_url: string;
  views_count: number;
  saves_count: number;
  created_at: string;
  published_at: string;
  is_featured?: boolean;
  mood?: string;
  aspect_ratio?: string;
  language_code?: string;
}
