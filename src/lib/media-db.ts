import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { mockMedia, popularSearches as mockPopularSearches, categories as mockCategories, reciters as mockReciters } from "@/lib/mock-media";
import { MediaItem } from "@/types/media";

const kindToCategory: Record<string, string> = {
  quran_video: "فيديوهات القرآن",
  islamic_design: "تصاميم إسلامية",
  chroma: "كروما",
  nature_scene: "مشاهد طبيعية",
  other: "محتوى إسلامي",
};

export const normalizeArabicText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

const levenshteinDistance = (a: string, b: string): number => {
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[a.length][b.length];
};

export const resolveClosestReciter = (
  query: string,
  reciterNames: string[],
): { correctedQuery: string; correctedReciter?: string } => {
  const normalizedQuery = normalizeArabicText(query);
  if (!normalizedQuery || normalizedQuery.length < 2 || !reciterNames.length) {
    return { correctedQuery: query.trim() };
  }

  const uniqueReciters = Array.from(new Set(reciterNames.map((name) => name.trim()).filter(Boolean)));

  const exact = uniqueReciters.find((name) => normalizeArabicText(name) === normalizedQuery);
  if (exact) return { correctedQuery: query.trim(), correctedReciter: exact };

  const ranked = uniqueReciters
    .map((name) => {
      const normalizedName = normalizeArabicText(name);
      const distance = levenshteinDistance(normalizedQuery, normalizedName);
      const lengthPenalty = Math.abs(normalizedName.length - normalizedQuery.length) * 0.15;
      const startsWithBoost = normalizedName.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedName) ? -0.75 : 0;
      const score = distance + lengthPenalty + startsWithBoost;
      return { name, normalizedName, score };
    })
    .sort((a, b) => a.score - b.score);

  const best = ranked[0];
  const acceptableThreshold = Math.max(1.2, normalizedQuery.length * 0.45);
  if (!best || best.score > acceptableThreshold) {
    return { correctedQuery: query.trim() };
  }

  return {
    correctedQuery: best.name,
    correctedReciter: best.name,
  };
};

export const fetchPublishedMedia = async (): Promise<MediaItem[]> => {
  if (!isSupabaseConfigured) return mockMedia;

  const [{ data: mediaRows }, { data: recitersRows }, { data: surahsRows }, { data: tagsRows }, { data: tagMapRows }] =
    await Promise.all([
      (supabase as any)
        .from("media_items")
        .select(
          "id, slug, title_ar, description_ar, media_kind, reciter_id, surah_id, duration_seconds, resolution, file_type, video_url, thumbnail_url, views_count, saves_count, created_at, published_at, is_featured, mood, aspect_ratio, language_code",
        )
        .eq("media_status", "published")
        .eq("is_visible", true)
        .order("published_at", { ascending: false }),
      (supabase as any).from("reciters").select("id, name_ar").eq("is_active", true),
      (supabase as any).from("surahs").select("id, name_ar"),
      (supabase as any).from("tags").select("id, label_ar"),
      (supabase as any).from("media_item_tags").select("media_item_id, tag_id"),
    ]);

  const reciterMap = new Map<string, string>((recitersRows || []).map((r: any) => [r.id, r.name_ar]));
  const surahMap = new Map<number, string>((surahsRows || []).map((s: any) => [s.id, s.name_ar]));
  const tagMap = new Map<string, string>((tagsRows || []).map((t: any) => [t.id, t.label_ar]));

  const itemTags = new Map<string, string[]>();
  for (const row of tagMapRows || []) {
    const current = itemTags.get(row.media_item_id) || [];
    const label = tagMap.get(row.tag_id);
    if (label) current.push(label);
    itemTags.set(row.media_item_id, current);
  }

  return (mediaRows || []).map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title_ar: item.title_ar,
    description_ar: item.description_ar || "",
    media_kind: item.media_kind,
    category: kindToCategory[item.media_kind] || "محتوى إسلامي",
    reciter: item.reciter_id ? reciterMap.get(item.reciter_id) : undefined,
    surah: item.surah_id ? surahMap.get(item.surah_id) : undefined,
    duration_seconds: item.duration_seconds || 0,
    tags: itemTags.get(item.id) || [],
    resolution: item.resolution || "HD",
    file_type: item.file_type || "mp4",
    video_url: item.video_url,
    thumbnail_url: item.thumbnail_url || "/placeholder.svg",
    views_count: item.views_count || 0,
    saves_count: item.saves_count || 0,
    created_at: item.created_at,
    published_at: item.published_at || item.created_at,
    is_featured: item.is_featured,
    mood: item.mood || undefined,
    aspect_ratio: item.aspect_ratio || undefined,
    language_code: item.language_code || "ar",
  }));
};

export const fetchPopularSearches = async (): Promise<string[]> => {
  if (!isSupabaseConfigured) return mockPopularSearches;

  const { data } = await (supabase as any)
    .from("search_logs")
    .select("normalized_query")
    .order("created_at", { ascending: false })
    .limit(80);

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const q = String(row.normalized_query || "").trim();
    if (!q) continue;
    counts.set(q, (counts.get(q) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([q]) => q);
};

export const logSearch = async (query: string, results: number) => {
  if (!isSupabaseConfigured) return;
  const cleaned = query.trim();
  if (!cleaned) return;
  await (supabase as any).rpc("log_search", { _query: cleaned, _lang: "ar", _results: results });
};

export interface CategoryItem {
  id: string;
  name_ar: string;
  description_ar?: string;
}

export const fetchActiveCategories = async (): Promise<CategoryItem[]> => {
  if (!isSupabaseConfigured) {
    return mockCategories.map((name, index) => ({ id: String(index + 1), name_ar: name, description_ar: "" }));
  }

  const { data } = await (supabase as any)
    .from("categories")
    .select("id, name_ar, description_ar, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data || []).map((row: any) => ({
    id: row.id,
    name_ar: row.name_ar,
    description_ar: row.description_ar || "",
  }));
};

export const getLocalReciters = () => mockReciters;
