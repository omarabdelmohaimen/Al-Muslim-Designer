import { describe, expect, it } from "vitest";
import { filterAdminMedia } from "@/lib/admin-media";

const items = [
  {
    id: "1",
    title_ar: "فيديو الفجر",
    slug: "fajr-video",
    description_ar: "قرآن",
    media_kind: "quran_video",
    media_status: "published",
    category_id: "c1",
    reciter_id: "r1",
    surah_id: 1,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "2",
    title_ar: "تصميم إسلامي",
    slug: "design-1",
    description_ar: "فن",
    media_kind: "islamic_design",
    media_status: "draft",
    category_id: "c2",
    reciter_id: null,
    surah_id: null,
    is_visible: false,
    created_at: "2026-01-02T00:00:00Z",
  },
];

describe("filterAdminMedia", () => {
  it("applies combined filters", () => {
    const result = filterAdminMedia(
      items,
      {
        query: "فيديو",
        kind: "quran_video",
        status: "published",
        categoryId: "c1",
        reciterId: "r1",
        surahId: "1",
        tagId: "t1",
      },
      { "1": ["t1"] },
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when tag filter does not match", () => {
    const result = filterAdminMedia(
      items,
      {
        query: "",
        kind: "all",
        status: "all",
        categoryId: "all",
        reciterId: "all",
        surahId: "all",
        tagId: "missing",
      },
      { "1": ["t1"] },
    );

    expect(result).toHaveLength(0);
  });
});
