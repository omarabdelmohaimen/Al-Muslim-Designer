import { describe, expect, it } from "vitest";
import { sanitizeSlug, translateDatabaseError, validateMediaInput } from "@/lib/validation";

describe("sanitizeSlug", () => {
  it("normalizes spaces and case", () => {
    expect(sanitizeSlug("  My Awesome Video  ")).toBe("my-awesome-video");
  });

  it("removes invalid chars and repeated dashes", () => {
    expect(sanitizeSlug("@@hello___world###")).toBe("hello-world");
  });
});

describe("validateMediaInput", () => {
  it("returns no errors for valid payload", () => {
    const errors = validateMediaInput({
      title_ar: "عنوان",
      slug: "my-video",
      description_ar: "وصف",
      duration_seconds: 120,
      resolution: "1080p",
      file_type: "mp4",
    });

    expect(errors).toEqual({});
  });

  it("rejects invalid payload", () => {
    const errors = validateMediaInput({
      title_ar: "",
      slug: "a",
      description_ar: "x".repeat(1200),
      duration_seconds: 0,
      resolution: "",
      file_type: "@@",
    });

    expect(errors.title_ar).toBeTruthy();
    expect(errors.slug).toBeTruthy();
    expect(errors.description_ar).toBeTruthy();
    expect(errors.duration_seconds).toBeTruthy();
    expect(errors.resolution).toBeTruthy();
    expect(errors.file_type).toBeTruthy();
  });
});

describe("translateDatabaseError", () => {
  it("maps duplicate slug errors", () => {
    expect(translateDatabaseError("duplicate key value violates unique constraint media_items_slug_unique_idx")).toContain("مستخدم بالفعل");
  });
});
