import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeo } from "@/hooks/use-seo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { FieldErrors, getDuplicateSlugMessage, sanitizeSlug, translateDatabaseError, validateMediaInput } from "@/lib/validation";

const UploadManagementPage = () => {
  useSeo({ title: "إضافة محتوى | المسلم المصمم", description: "رفع فيديو جديد مع صورة مصغرة", canonicalPath: "/private-portal-amm/uploads" });

  const [uploading, setUploading] = useState(false);
  const [showManageHint, setShowManageHint] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    title_ar: "",
    slug: "",
    description_ar: "",
    media_kind: "quran_video",
    category_id: "",
    reciter_id: "",
    surah_id: "",
    resolution: "1080p",
    file_type: "mp4",
    duration_seconds: 60,
  });
  const [categories, setCategories] = useState<Array<Pick<Tables<"categories">, "id" | "name_ar">>>([]);
  const [reciters, setReciters] = useState<Array<Pick<Tables<"reciters">, "id" | "name_ar">>>([]);
  const [surahs, setSurahs] = useState<Array<Pick<Tables<"surahs">, "id" | "name_ar">>>([]);
  const [tags, setTags] = useState<Array<Pick<Tables<"tags">, "id" | "label_ar">>>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const canSubmit = useMemo(() => form.title_ar.trim() && form.slug.trim() && videoFile, [form, videoFile]);

  useEffect(() => {
    const loadReferenceData = async () => {
      setLoadingRefs(true);
      const [categoriesRes, recitersRes, surahsRes, tagsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name_ar")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name_ar", { ascending: true }),
        supabase.from("reciters").select("id,name_ar").eq("is_active", true).order("name_ar", { ascending: true }),
        supabase.from("surahs").select("id,name_ar").order("id", { ascending: true }),
        supabase.from("tags").select("id,label_ar").order("label_ar", { ascending: true }),
      ]);

      if (categoriesRes.error || recitersRes.error || surahsRes.error || tagsRes.error) {
        toast({
          title: "فشل تحميل القوائم",
          description:
            translateDatabaseError(
              categoriesRes.error?.message ||
                recitersRes.error?.message ||
                surahsRes.error?.message ||
                tagsRes.error?.message,
            ) || "تعذر تحميل التصنيفات أو الشيوخ أو السور أو الوسوم",
        });
      }

      setCategories(categoriesRes.data ?? []);
      setReciters(recitersRes.data ?? []);
      setSurahs(surahsRes.data ?? []);
      setTags(tagsRes.data ?? []);
      setLoadingRefs(false);
    };

    void loadReferenceData();
  }, []);

  const onFile = (setter: (f: File | null) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.files?.[0] ?? null);
  };

  const checkSlugDuplicate = async (slug: string) => {
    const { data, error } = await supabase.from("media_items").select("id").eq("slug", slug).limit(1);
    if (error) throw error;
    return Boolean((data ?? []).length);
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <h1 className="text-3xl font-black">إضافة محتوى جديد</h1>

        <form
          className="space-y-4 rounded-lg border border-border bg-card p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;

            const validationErrors = validateMediaInput({
              title_ar: form.title_ar,
              slug: form.slug,
              description_ar: form.description_ar,
              duration_seconds: Number(form.duration_seconds),
              resolution: form.resolution,
              file_type: form.file_type,
            });

            if (!videoFile) {
              validationErrors.video = "ملف الفيديو مطلوب.";
            }

            setErrors(validationErrors);
            if (Object.keys(validationErrors).length > 0) return;

            setUploading(true);
            try {
              const normalizedSlug = sanitizeSlug(form.slug);
              const duplicated = await checkSlugDuplicate(normalizedSlug);
              if (duplicated) {
                setErrors((prev) => ({ ...prev, slug: getDuplicateSlugMessage() }));
                setUploading(false);
                return;
              }

              const videoUpload = await uploadFileToCloudinary(videoFile as File, "video");
              const thumbUpload = thumbFile ? await uploadFileToCloudinary(thumbFile, "thumbnail") : null;

              const payload: TablesInsert<"media_items"> = {
                title_ar: form.title_ar.trim(),
                slug: normalizedSlug,
                description_ar: form.description_ar.trim(),
                media_kind: form.media_kind as Tables<"media_items">["media_kind"],
                media_status: "published",
                is_visible: true,
                category_id: form.category_id || null,
                reciter_id: form.reciter_id || null,
                surah_id: form.surah_id ? Number(form.surah_id) : null,
                duration_seconds: Math.max(1, Number(form.duration_seconds)),
                resolution: form.resolution.trim(),
                file_type: form.file_type.trim().toLowerCase(),
                video_url: videoUpload.secureUrl,
                thumbnail_url: thumbUpload?.secureUrl ?? null,
                pcloud_video_file_id: videoUpload.publicId,
                pcloud_thumbnail_file_id: thumbUpload?.publicId ?? null,
                download_enabled: true,
                published_at: new Date().toISOString(),
              };

              const { data: insertedItem, error } = await supabase.from("media_items").insert(payload).select("id").single();
              if (error) throw error;

              const uniqueTagIds = Array.from(new Set(selectedTagIds));
              if (insertedItem?.id && uniqueTagIds.length) {
                const { error: tagsError } = await supabase
                  .from("media_item_tags")
                  .insert(uniqueTagIds.map((tagId) => ({ media_item_id: insertedItem.id, tag_id: tagId })));
                if (tagsError) throw tagsError;
              }

              toast({ title: "تم رفع المحتوى بنجاح" });
              setShowManageHint(true);
              setForm({
                title_ar: "",
                slug: "",
                description_ar: "",
                media_kind: "quran_video",
                category_id: "",
                reciter_id: "",
                surah_id: "",
                resolution: "1080p",
                file_type: "mp4",
                duration_seconds: 60,
              });
              setErrors({});
              setSelectedTagIds([]);
              setVideoFile(null);
              setThumbFile(null);
            } catch (err: any) {
              toast({ title: "فشل الرفع", description: translateDatabaseError(err?.message) || "حدث خطأ أثناء الرفع" });
            } finally {
              setUploading(false);
            }
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Input
                value={form.title_ar}
                maxLength={160}
                onChange={(e) => {
                  setForm((p) => ({ ...p, title_ar: e.target.value }));
                  setErrors((prev) => ({ ...prev, title_ar: "" }));
                }}
                placeholder="العنوان"
                className="h-11"
              />
              {errors.title_ar && <p className="text-xs text-destructive">{errors.title_ar}</p>}
            </div>
            <div className="space-y-1">
              <Input
                value={form.slug}
                maxLength={120}
                onChange={(e) => {
                  setForm((p) => ({ ...p, slug: sanitizeSlug(e.target.value) }));
                  setErrors((prev) => ({ ...prev, slug: "" }));
                }}
                placeholder="slug"
                className="h-11"
              />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Textarea
                value={form.description_ar}
                maxLength={1000}
                onChange={(e) => {
                  setForm((p) => ({ ...p, description_ar: e.target.value }));
                  setErrors((prev) => ({ ...prev, description_ar: "" }));
                }}
                placeholder="الوصف"
                className="min-h-28"
              />
              {errors.description_ar && <p className="text-xs text-destructive">{errors.description_ar}</p>}
            </div>
            <select value={form.media_kind} onChange={(e) => setForm((p) => ({ ...p, media_kind: e.target.value }))} className="h-11 rounded-md border border-input bg-background px-3">
              <option value="quran_video">Quran Video</option>
              <option value="islamic_design">Islamic Design</option>
              <option value="chroma">Chroma</option>
              <option value="nature_scene">Nature Scene</option>
              <option value="other">Other</option>
            </select>
            <div className="space-y-1">
              <Input
                type="number"
                min={1}
                value={form.duration_seconds}
                onChange={(e) => {
                  setForm((p) => ({ ...p, duration_seconds: Number(e.target.value) }));
                  setErrors((prev) => ({ ...prev, duration_seconds: "" }));
                }}
                placeholder="المدة بالثواني"
                className="h-11"
              />
              {errors.duration_seconds && <p className="text-xs text-destructive">{errors.duration_seconds}</p>}
            </div>
            <select
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              className="h-11 rounded-md border border-input bg-background px-3"
              disabled={loadingRefs}
            >
              <option value="">بدون تصنيف</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ar}
                </option>
              ))}
            </select>
            <select
              value={form.reciter_id}
              onChange={(e) => setForm((p) => ({ ...p, reciter_id: e.target.value }))}
              className="h-11 rounded-md border border-input bg-background px-3"
              disabled={loadingRefs}
            >
              <option value="">بدون شيخ</option>
              {reciters.map((reciter) => (
                <option key={reciter.id} value={reciter.id}>
                  {reciter.name_ar}
                </option>
              ))}
            </select>
            <select
              value={form.surah_id}
              onChange={(e) => setForm((p) => ({ ...p, surah_id: e.target.value }))}
              className="h-11 rounded-md border border-input bg-background px-3"
              disabled={loadingRefs}
            >
              <option value="">بدون سورة</option>
              {surahs.map((surah) => (
                <option key={surah.id} value={surah.id}>
                  {surah.id} - {surah.name_ar}
                </option>
              ))}
            </select>
            <div className="space-y-1">
              <Input
                value={form.resolution}
                maxLength={24}
                onChange={(e) => {
                  setForm((p) => ({ ...p, resolution: e.target.value }));
                  setErrors((prev) => ({ ...prev, resolution: "" }));
                }}
                placeholder="الدقة"
                className="h-11"
              />
              {errors.resolution && <p className="text-xs text-destructive">{errors.resolution}</p>}
            </div>
            <div className="space-y-1">
              <Input
                value={form.file_type}
                maxLength={10}
                onChange={(e) => {
                  setForm((p) => ({ ...p, file_type: e.target.value }));
                  setErrors((prev) => ({ ...prev, file_type: "" }));
                }}
                placeholder="نوع الملف (mp4)"
                className="h-11"
              />
              {errors.file_type && <p className="text-xs text-destructive">{errors.file_type}</p>}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">الوسوم (اختيار متعدد)</p>
            {loadingRefs ? (
              <Skeleton className="h-16" />
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد وسوم حالياً.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <Button
                      key={tag.id}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                        );
                      }}
                    >
                      {tag.label_ar}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="block rounded-lg border border-dashed border-border bg-background p-5 text-center">
            <UploadCloud className="mx-auto mb-2 h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground">اسحب أو اختر ملف الفيديو</span>
            <input type="file" accept="video/*" className="mt-3 block w-full text-sm" onChange={onFile(setVideoFile)} />
            {errors.video && <p className="mt-2 text-xs text-destructive">{errors.video}</p>}
          </label>

          <label className="block rounded-lg border border-dashed border-border bg-background p-5 text-center">
            <span className="text-sm text-muted-foreground">صورة مصغرة (اختياري)</span>
            <input type="file" accept="image/*" className="mt-3 block w-full text-sm" onChange={onFile(setThumbFile)} />
          </label>

          <Button disabled={!canSubmit || uploading}>
            {uploading ? "جاري الرفع..." : "نشر المحتوى"}
          </Button>
        </form>

        {showManageHint && (
          <section className="rounded-lg border border-border bg-card p-5">
            <p className="mb-3 text-sm text-muted-foreground">تمت الإضافة بنجاح، ويمكنك الآن تعديل أو حذف الفيديو من صفحة الإدارة.</p>
            <Link to="/private-portal-amm/videos" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              الانتقال إلى إدارة الفيديوهات
            </Link>
          </section>
        )}
      </section>
    </AppShell>
  );
};

export default UploadManagementPage;
