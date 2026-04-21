import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { SearchBar } from "@/components/site/SearchBar";
import { MediaCard } from "@/components/site/MediaCard";
import { useSeo } from "@/hooks/use-seo";
import { MediaItem, MediaKind } from "@/types/media";
import { fetchPublishedMedia } from "@/lib/media-db";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const sorters = {
  newest: (a: any, b: any) => +new Date(b.published_at) - +new Date(a.published_at),
  oldest: (a: any, b: any) => +new Date(a.published_at) - +new Date(b.published_at),
  viewed: (a: any, b: any) => b.views_count - a.views_count,
  saved: (a: any, b: any) => b.saves_count - a.saves_count,
  relevant: (a: any, b: any) => b.views_count + b.saves_count - (a.views_count + a.saves_count),
};

export const MediaGridPage = ({
  title,
  subtitle,
  kind,
  path,
}: {
  title: string;
  subtitle: string;
  kind?: MediaKind;
  path: string;
}) => {
  useSeo({ title: `${title} | المسلم المصمم`, description: subtitle, canonicalPath: path });

  const [sort, setSort] = useState<keyof typeof sorters>("newest");
  const [category, setCategory] = useState("all");
  const [reciter, setReciter] = useState("all");
  const [mood, setMood] = useState("all");
  const [dbMedia, setDbMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchPublishedMedia();
      setDbMedia(data);
      setLoading(false);
    };
    void load();
  }, []);

  const dynamicCategories = useMemo(() => Array.from(new Set(dbMedia.map((x) => x.category).filter(Boolean))), [dbMedia]);
  const dynamicReciters = useMemo(() => Array.from(new Set(dbMedia.map((x) => x.reciter).filter(Boolean) as string[])), [dbMedia]);

  const items = useMemo(() => {
    const filtered = dbMedia.filter((item) => {
      if (kind && item.media_kind !== kind) return false;
      if (category !== "all" && item.category !== category) return false;
      if (reciter !== "all" && item.reciter !== reciter) return false;
      if (mood !== "all" && item.mood !== mood) return false;
      return true;
    });

    return filtered.sort(sorters[sort]);
  }, [dbMedia, kind, category, reciter, mood, sort]);

  const resetFilters = () => {
    setSort("newest");
    setCategory("all");
    setReciter("all");
    setMood("all");
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{title}</h1>
          <p className="max-w-3xl text-muted-foreground">{subtitle}</p>
        </div>

        <SearchBar />

        <div className="grid gap-3 rounded-lg border border-border bg-card/60 p-4 md:grid-cols-5">
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof sorters)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="viewed">الأكثر مشاهدة</option>
            <option value="saved">الأكثر حفظًا</option>
            <option value="relevant">الأكثر صلة</option>
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">كل التصنيفات</option>
            {dynamicCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select value={reciter} onChange={(e) => setReciter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">كل القراء</option>
            {dynamicReciters.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">كل الأجواء</option>
            <option value="هادئ">هادئ</option>
          </select>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <span>{items.length} عنصر</span>
            <Button variant="ghost" size="sm" onClick={resetFilters}>إعادة ضبط</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => <MediaCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <p>لا يوجد محتوى منشور مطابق للفلاتر الحالية.</p>
            <Button variant="outline" onClick={resetFilters}>عرض كل المحتوى</Button>
          </div>
        )}
      </section>
    </AppShell>
  );
};
