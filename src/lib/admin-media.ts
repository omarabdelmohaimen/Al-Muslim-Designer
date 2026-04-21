export type AdminMediaRow = {
  id: string;
  title_ar: string | null;
  slug: string;
  description_ar: string | null;
  media_kind: string;
  media_status: string;
  category_id: string | null;
  reciter_id: string | null;
  surah_id: number | null;
  is_visible: boolean;
  created_at: string;
};

export type AdminMediaFilters = {
  query: string;
  kind: string;
  status: string;
  categoryId: string;
  reciterId: string;
  surahId: string;
  tagId: string;
};

export const filterAdminMedia = <T extends AdminMediaRow>(
  items: T[],
  filters: AdminMediaFilters,
  mediaTagMap: Record<string, string[]>,
) => {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.kind !== "all" && item.media_kind !== filters.kind) return false;
    if (filters.status !== "all" && item.media_status !== filters.status) return false;
    if (filters.categoryId !== "all" && (item.category_id || "") !== filters.categoryId) return false;
    if (filters.reciterId !== "all" && (item.reciter_id || "") !== filters.reciterId) return false;
    if (filters.surahId !== "all" && String(item.surah_id || "") !== filters.surahId) return false;

    if (filters.tagId !== "all") {
      const rowTags = mediaTagMap[item.id] || [];
      if (!rowTags.includes(filters.tagId)) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [item.title_ar || "", item.slug || "", item.description_ar || ""]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
};
