import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeo } from "@/hooks/use-seo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deleteCloudinaryFile } from "@/lib/cloudinary";
import type { Tables } from "@/integrations/supabase/types";
import { filterAdminMedia } from "@/lib/admin-media";
import {
  FieldErrors,
  getDuplicateSlugMessage,
  sanitizeSlug,
  translateDatabaseError,
  validateMediaInput,
} from "@/lib/validation";

type MediaItemRow = Pick<
  Tables<"media_items">,
  | "id"
  | "title_ar"
  | "slug"
  | "description_ar"
  | "media_kind"
  | "media_status"
  | "is_visible"
  | "is_featured"
  | "download_enabled"
  | "duration_seconds"
  | "resolution"
  | "file_type"
  | "category_id"
  | "reciter_id"
  | "surah_id"
  | "created_at"
  | "video_url"
  | "thumbnail_url"
  | "pcloud_video_file_id"
  | "pcloud_thumbnail_file_id"
>;

interface MediaManagementPageProps {
  title: string;
  description: string;
  canonicalPath: string;
  fixedKind?: MediaItemRow["media_kind"];
}

const toEditForm = (item: MediaItemRow) => ({
  title_ar: item.title_ar ?? "",
  slug: item.slug ?? "",
  description_ar: item.description_ar ?? "",
  media_kind: item.media_kind,
  duration_seconds: item.duration_seconds ?? 60,
  resolution: item.resolution ?? "1080p",
  file_type: item.file_type ?? "mp4",
  category_id: item.category_id ?? "",
  reciter_id: item.reciter_id ?? "",
  surah_id: item.surah_id ? String(item.surah_id) : "",
  media_status: item.media_status,
  is_visible: item.is_visible,
  is_featured: item.is_featured,
  download_enabled: item.download_enabled,
});

export const MediaManagementPage = ({ title, description, canonicalPath, fixedKind }: MediaManagementPageProps) => {
  useSeo({ title: `${title} | المسلم المصمم`, description, canonicalPath });

  const [tags, setTags] = useState<Array<Pick<Tables<"tags">, "id" | "label_ar">>>([]);
  const [categories, setCategories] = useState<Array<Pick<Tables<"categories">, "id" | "name_ar">>>([]);
  const [reciters, setReciters] = useState<Array<Pick<Tables<"reciters">, "id" | "name_ar">>>([]);
  const [surahs, setSurahs] = useState<Array<Pick<Tables<"surahs">, "id" | "name_ar">>>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [items, setItems] = useState<MediaItemRow[]>([]);
  const [mediaTagMap, setMediaTagMap] = useState<Record<string, string[]>>({});

  const [query, setQuery] = useState("");
  const [filterKind, setFilterKind] = useState(fixedKind ?? "all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterReciter, setFilterReciter] = useState("all");
  const [filterSurah, setFilterSurah] = useState("all");
  const [filterTag, setFilterTag] = useState("all");

  const [editingItem, setEditingItem] = useState<MediaItemRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<MediaItemRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [editForm, setEditForm] = useState(() => ({
    title_ar: "",
    slug: "",
    description_ar: "",
    media_kind: (fixedKind || "quran_video") as MediaItemRow["media_kind"],
    duration_seconds: 60,
    resolution: "1080p",
    file_type: "mp4",
    category_id: "",
    reciter_id: "",
    surah_id: "",
    media_status: "published" as MediaItemRow["media_status"],
    is_visible: true,
    is_featured: false,
    download_enabled: true,
  }));

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name_ar])), [categories]);
  const reciterMap = useMemo(() => Object.fromEntries(reciters.map((r) => [r.id, r.name_ar])), [reciters]);
  const surahMap = useMemo(() => Object.fromEntries(surahs.map((s) => [String(s.id), `${s.id} - ${s.name_ar}`])), [surahs]);
  const tagMap = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t.label_ar])), [tags]);

  const filteredItems = useMemo(
    () =>
      filterAdminMedia(
        items,
        {
          query,
          kind: fixedKind ?? filterKind,
          status: filterStatus,
          categoryId: filterCategory,
          reciterId: filterReciter,
          surahId: filterSurah,
          tagId: filterTag,
        },
        mediaTagMap,
      ),
    [items, query, fixedKind, filterKind, filterStatus, filterCategory, filterReciter, filterSurah, filterTag, mediaTagMap],
  );

  const loadMediaItems = async () => {
    setLoadingList(true);
    let req = supabase
      .from("media_items")
      .select("id,title_ar,slug,description_ar,media_kind,media_status,is_visible,is_featured,download_enabled,duration_seconds,resolution,file_type,category_id,reciter_id,surah_id,created_at,video_url,thumbnail_url,pcloud_video_file_id,pcloud_thumbnail_file_id")
      .order("created_at", { ascending: false });

    if (fixedKind) req = req.eq("media_kind", fixedKind);

    const { data, error } = await req;

    if (error) {
      toast({ title: "فشل تحميل المحتوى", description: translateDatabaseError(error.message) });
      setItems([]);
      setLoadingList(false);
      return;
    }

    setItems(data ?? []);
    setLoadingList(false);
  };

  const loadTagMapForItems = async (mediaIds: string[]) => {
    if (!mediaIds.length) {
      setMediaTagMap({});
      return;
    }

    const { data, error } = await supabase
      .from("media_item_tags")
      .select("media_item_id,tag_id")
      .in("media_item_id", mediaIds);

    if (error) {
      toast({ title: "فشل تحميل ربط الوسوم", description: translateDatabaseError(error.message) });
      return;
    }

    const nextMap: Record<string, string[]> = {};
    (data ?? []).forEach((row) => {
      if (!nextMap[row.media_item_id]) nextMap[row.media_item_id] = [];
      nextMap[row.media_item_id].push(row.tag_id);
    });

    setMediaTagMap(nextMap);
  };

  const loadTags = async () => {
    const { data, error } = await supabase.from("tags").select("id,label_ar").order("label_ar", { ascending: true });
    if (error) {
      toast({ title: "فشل تحميل الوسوم", description: translateDatabaseError(error.message) });
      setTags([]);
      return;
    }

    setTags(data ?? []);
  };

  const loadReferenceData = async () => {
    const [categoriesRes, recitersRes, surahsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id,name_ar")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name_ar", { ascending: true }),
      supabase.from("reciters").select("id,name_ar").eq("is_active", true).order("name_ar", { ascending: true }),
      supabase.from("surahs").select("id,name_ar").order("id", { ascending: true }),
    ]);

    if (categoriesRes.error || recitersRes.error || surahsRes.error) {
      toast({
        title: "فشل تحميل القوائم المرجعية",
        description: translateDatabaseError(categoriesRes.error?.message || recitersRes.error?.message || surahsRes.error?.message),
      });
    }

    setCategories(categoriesRes.data ?? []);
    setReciters(recitersRes.data ?? []);
    setSurahs(surahsRes.data ?? []);
  };

  const loadSelectedTags = async (mediaId: string) => {
    setLoadingTags(true);
    const { data, error } = await supabase.from("media_item_tags").select("tag_id").eq("media_item_id", mediaId);
    setLoadingTags(false);
    if (error) {
      toast({ title: "فشل تحميل وسوم المحتوى", description: translateDatabaseError(error.message) });
      setSelectedTagIds([]);
      return;
    }

    setSelectedTagIds((data ?? []).map((row) => row.tag_id));
  };

  const validateEditForm = async () => {
    const errors = validateMediaInput({
      title_ar: editForm.title_ar,
      slug: editForm.slug,
      description_ar: editForm.description_ar,
      duration_seconds: Number(editForm.duration_seconds),
      resolution: editForm.resolution,
      file_type: editForm.file_type,
    });

    if (!editingItem) return errors;

    if (!errors.slug) {
      const { data, error } = await supabase
        .from("media_items")
        .select("id")
        .eq("slug", editForm.slug)
        .neq("id", editingItem.id)
        .limit(1);

      if (error) {
        errors.slug = translateDatabaseError(error.message);
      } else if ((data ?? []).length > 0) {
        errors.slug = getDuplicateSlugMessage();
      }
    }

    return errors;
  };

  const resetFilters = () => {
    setQuery("");
    if (!fixedKind) setFilterKind("all");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterReciter("all");
    setFilterSurah("all");
    setFilterTag("all");
  };

  useEffect(() => {
    void loadMediaItems();
    void loadTags();
    void loadReferenceData();
  }, [fixedKind]);

  useEffect(() => {
    void loadTagMapForItems(items.map((item) => item.id));
  }, [items]);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-black">{title}</h1>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالعنوان أو slug" className="h-10 ps-9" />
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-7">
          <select
            value={fixedKind ?? filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            disabled={Boolean(fixedKind)}
          >
            <option value="all">كل الأنواع</option>
            <option value="quran_video">Quran Video</option>
            <option value="islamic_design">Islamic Design</option>
            <option value="chroma">Chroma</option>
            <option value="nature_scene">Nature Scene</option>
            <option value="other">Other</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">كل الحالات</option>
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">كل التصنيفات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_ar}
              </option>
            ))}
          </select>

          <select value={filterReciter} onChange={(e) => setFilterReciter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">كل الشيوخ</option>
            {reciters.map((reciter) => (
              <option key={reciter.id} value={reciter.id}>
                {reciter.name_ar}
              </option>
            ))}
          </select>

          <select value={filterSurah} onChange={(e) => setFilterSurah(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">كل السور</option>
            {surahs.map((surah) => (
              <option key={surah.id} value={String(surah.id)}>
                {surah.id} - {surah.name_ar}
              </option>
            ))}
          </select>

          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">كل الوسوم</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label_ar}
              </option>
            ))}
          </select>

          <Button variant="outline" className="h-10" onClick={resetFilters}>
            <X className="h-4 w-4" />
            إعادة ضبط
          </Button>
        </div>

        {loadingList ? (
          <div className="space-y-2 rounded-lg border border-border bg-card p-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="space-y-4 rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <p>لا توجد عناصر مطابقة للفلاتر الحالية.</p>
            <Button variant="outline" onClick={resetFilters}>عرض كل العناصر</Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الشيخ</TableHead>
                  <TableHead>السورة</TableHead>
                  <TableHead>الوسوم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الظهور</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="w-[190px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const rowTags = (mediaTagMap[item.id] || []).map((tagId) => tagMap[tagId]).filter(Boolean);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title_ar}</TableCell>
                      <TableCell>{(item.category_id && categoryMap[item.category_id]) || "-"}</TableCell>
                      <TableCell>{(item.reciter_id && reciterMap[item.reciter_id]) || "-"}</TableCell>
                      <TableCell>{(item.surah_id && surahMap[String(item.surah_id)]) || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rowTags.length ? rowTags.slice(0, 3).map((tag) => (
                            <span key={`${item.id}-${tag}`} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">#{tag}</span>
                          )) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>{item.media_status === "published" ? "منشور" : item.media_status === "draft" ? "مسودة" : "مؤرشف"}</TableCell>
                      <TableCell>{item.is_visible ? "ظاهر" : "مخفي"}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString("ar-EG")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setEditForm({ ...toEditForm(item), slug: sanitizeSlug(toEditForm(item).slug) });
                              setEditErrors({});
                              void loadSelectedTags(item.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeletingItem(item)}>
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setEditErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المحتوى</DialogTitle>
            <DialogDescription>عدّل البيانات الأساسية ثم احفظ التغييرات.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">بيانات المحتوى</TabsTrigger>
              <TabsTrigger value="tags">ربط الوسوم</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-title">العنوان</Label>
                  <Input id="edit-title" maxLength={160} value={editForm.title_ar} onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, title_ar: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, title_ar: "" }));
                  }} />
                  {editErrors.title_ar && <p className="text-xs text-destructive">{editErrors.title_ar}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input id="edit-slug" maxLength={120} value={editForm.slug} onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, slug: sanitizeSlug(e.target.value) }));
                    setEditErrors((prev) => ({ ...prev, slug: "" }));
                  }} />
                  {editErrors.slug && <p className="text-xs text-destructive">{editErrors.slug}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-kind">النوع</Label>
                  {fixedKind ? (
                    <Input id="edit-kind" value={fixedKind} disabled />
                  ) : (
                    <select
                      id="edit-kind"
                      value={editForm.media_kind}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, media_kind: e.target.value as MediaItemRow["media_kind"] }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3"
                    >
                      <option value="quran_video">Quran Video</option>
                      <option value="islamic_design">Islamic Design</option>
                      <option value="chroma">Chroma</option>
                      <option value="nature_scene">Nature Scene</option>
                      <option value="other">Other</option>
                    </select>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Textarea id="edit-description" maxLength={1000} value={editForm.description_ar} onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, description_ar: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, description_ar: "" }));
                  }} />
                  {editErrors.description_ar && <p className="text-xs text-destructive">{editErrors.description_ar}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">المدة (ث)</Label>
                  <Input id="edit-duration" type="number" min={1} value={editForm.duration_seconds} onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, duration_seconds: Number(e.target.value) || 1 }));
                    setEditErrors((prev) => ({ ...prev, duration_seconds: "" }));
                  }} />
                  {editErrors.duration_seconds && <p className="text-xs text-destructive">{editErrors.duration_seconds}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-resolution">الدقة</Label>
                  <Input id="edit-resolution" maxLength={24} value={editForm.resolution} onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, resolution: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, resolution: "" }));
                  }} />
                  {editErrors.resolution && <p className="text-xs text-destructive">{editErrors.resolution}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-file-type">الامتداد</Label>
                  <Input id="edit-file-type" maxLength={10} value={editForm.file_type} onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, file_type: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, file_type: "" }));
                  }} />
                  {editErrors.file_type && <p className="text-xs text-destructive">{editErrors.file_type}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">التصنيف</Label>
                  <select
                    id="edit-category"
                    value={editForm.category_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category_id: e.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  >
                    <option value="">بدون تصنيف</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reciter">الشيخ</Label>
                  <select
                    id="edit-reciter"
                    value={editForm.reciter_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, reciter_id: e.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  >
                    <option value="">بدون شيخ</option>
                    {reciters.map((reciter) => (
                      <option key={reciter.id} value={reciter.id}>
                        {reciter.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-surah">السورة</Label>
                  <select
                    id="edit-surah"
                    value={editForm.surah_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, surah_id: e.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  >
                    <option value="">بدون سورة</option>
                    {surahs.map((surah) => (
                      <option key={surah.id} value={surah.id}>
                        {surah.id} - {surah.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">الحالة</Label>
                  <select id="edit-status" value={editForm.media_status} onChange={(e) => setEditForm((prev) => ({ ...prev, media_status: e.target.value as MediaItemRow["media_status"] }))} className="h-10 w-full rounded-md border border-input bg-background px-3">
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.is_visible} onChange={(e) => setEditForm((prev) => ({ ...prev, is_visible: e.target.checked }))} />
                  ظاهر في الموقع
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.is_featured} onChange={(e) => setEditForm((prev) => ({ ...prev, is_featured: e.target.checked }))} />
                  مميز
                </label>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" checked={editForm.download_enabled} onChange={(e) => setEditForm((prev) => ({ ...prev, download_enabled: e.target.checked }))} />
                  السماح بالتحميل
                </label>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">اختر الوسوم المرتبطة بهذا العنصر (يمكن اختيار أكثر من وسم).</p>
                {loadingTags ? (
                  <Skeleton className="h-20" />
                ) : tags.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">لا توجد وسوم حالياً، أضف وسوماً من إدارة الوسوم أولاً.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const selected = selectedTagIds.includes(tag.id);
                      return (
                        <Button
                          key={tag.id}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
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
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>إلغاء</Button>
            <Button
              disabled={!editingItem || savingId === editingItem?.id}
              onClick={async () => {
                if (!editingItem) return;

                const errors = await validateEditForm();
                setEditErrors(errors);
                if (Object.keys(errors).length) return;

                setSavingId(editingItem.id);

                const { error } = await supabase
                  .from("media_items")
                  .update({
                    title_ar: editForm.title_ar.trim(),
                    slug: sanitizeSlug(editForm.slug),
                    description_ar: editForm.description_ar.trim(),
                    media_kind: fixedKind || editForm.media_kind,
                    duration_seconds: Math.max(1, Number(editForm.duration_seconds) || 1),
                    resolution: editForm.resolution.trim(),
                    file_type: editForm.file_type.trim().toLowerCase(),
                    category_id: editForm.category_id || null,
                    reciter_id: editForm.reciter_id || null,
                    surah_id: editForm.surah_id ? Number(editForm.surah_id) : null,
                    media_status: editForm.media_status,
                    is_visible: editForm.is_visible,
                    is_featured: editForm.is_featured,
                    download_enabled: editForm.download_enabled,
                  })
                  .eq("id", editingItem.id);

                if (error) {
                  toast({ title: "فشل التعديل", description: translateDatabaseError(error.message) });
                  setSavingId(null);
                  return;
                }

                const uniqueTags = Array.from(new Set(selectedTagIds));
                const { error: clearTagsError } = await supabase
                  .from("media_item_tags")
                  .delete()
                  .eq("media_item_id", editingItem.id);

                if (clearTagsError) {
                  toast({ title: "تم تحديث البيانات لكن فشل تحديث الوسوم", description: translateDatabaseError(clearTagsError.message) });
                  setSavingId(null);
                  return;
                }

                if (uniqueTags.length) {
                  const { error: insertTagsError } = await supabase
                    .from("media_item_tags")
                    .insert(uniqueTags.map((tagId) => ({ media_item_id: editingItem.id, tag_id: tagId })));

                  if (insertTagsError) {
                    toast({ title: "تم تحديث البيانات لكن فشل حفظ الوسوم", description: translateDatabaseError(insertTagsError.message) });
                    setSavingId(null);
                    return;
                  }
                }

                toast({ title: "تم تحديث المحتوى بنجاح" });
                setEditingItem(null);
                setSavingId(null);
                await loadMediaItems();
              }}
            >
              {savingId === editingItem?.id ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف العنصر</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف العنصر نهائيًا من لوحة التحكم والموقع العام.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deletingItem || deletingId === deletingItem?.id}
              onClick={async (e) => {
                e.preventDefault();
                if (!deletingItem) return;

                setDeletingId(deletingItem.id);
                const videoFileId = deletingItem.pcloud_video_file_id;
                const thumbFileId = deletingItem.pcloud_thumbnail_file_id;

                await supabase.from("media_item_tags").delete().eq("media_item_id", deletingItem.id);

                const { error } = await supabase.from("media_items").delete().eq("id", deletingItem.id);
                if (error) {
                  toast({ title: "فشل الحذف", description: translateDatabaseError(error.message) });
                  setDeletingId(null);
                  return;
                }

                const deletionTasks = [
                  videoFileId ? deleteCloudinaryFile(String(videoFileId), "video") : Promise.resolve(),
                  thumbFileId ? deleteCloudinaryFile(String(thumbFileId), "image") : Promise.resolve(),
                ];

                const settled = await Promise.allSettled(deletionTasks);
                const failedRemoteDelete = settled.find((item) => item.status === "rejected");
                if (failedRemoteDelete) {
                  console.warn("Some remote Cloudinary files could not be deleted", failedRemoteDelete);
                }

                toast({ title: "تم حذف العنصر بنجاح" });
                setDeletingItem(null);
                setDeletingId(null);
                await loadMediaItems();
              }}
            >
              {deletingId === deletingItem?.id ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};
