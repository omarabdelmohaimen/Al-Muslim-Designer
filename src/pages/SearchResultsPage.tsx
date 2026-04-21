import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/site/AppShell";
import { SearchBar } from "@/components/site/SearchBar";
import { MediaCard } from "@/components/site/MediaCard";
import { useSeo } from "@/hooks/use-seo";
import { fetchPopularSearches, fetchPublishedMedia, logSearch, normalizeArabicText, resolveClosestReciter } from "@/lib/media-db";
import { MediaItem } from "@/types/media";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const [dbMedia, setDbMedia] = useState<MediaItem[]>([]);
  const [dbPopular, setDbPopular] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useSeo({ title: `نتائج البحث ${q ? `- ${q}` : ""} | المسلم المصمم`, description: "بحث ذكي عربي/إنجليزي داخل المكتبة", canonicalPath: `/search${q ? `?q=${encodeURIComponent(q)}` : ""}` });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [media, popular] = await Promise.all([fetchPublishedMedia(), fetchPopularSearches()]);
      setDbMedia(media);
      setDbPopular(popular);
      setLoading(false);
    };
    void load();
  }, []);

  const sourceMedia = dbMedia;
  const reciterNames = useMemo(
    () => Array.from(new Set(sourceMedia.map((item) => item.reciter).filter(Boolean) as string[])),
    [sourceMedia],
  );

  const correction = useMemo(() => {
    if (!q) return { correctedQuery: "" };
    return resolveClosestReciter(q, reciterNames);
  }, [q, reciterNames]);

  const effectiveQuery = q ? correction.correctedQuery.trim() : "";
  const wasCorrected =
    !!q &&
    !!effectiveQuery &&
    normalizeArabicText(q) !== normalizeArabicText(effectiveQuery);

  const results = useMemo(() => {
    if (!effectiveQuery) return [];
    const n = effectiveQuery.toLowerCase();
    const normalizedN = normalizeArabicText(effectiveQuery);

    return sourceMedia
      .map((item) => {
        const hayFields = [item.title_ar, item.description_ar, item.reciter, item.surah, item.category, ...item.tags];
        const hay = hayFields.join(" ").toLowerCase();
        const normalizedHay = normalizeArabicText(hayFields.join(" "));
        const reciterNormalized = normalizeArabicText(item.reciter || "");

        const directMatch = hay.includes(n) || normalizedHay.includes(normalizedN);
        const reciterMatch = !!item.reciter && reciterNormalized.includes(normalizedN);
        const score =
          (directMatch ? 6 : 0) +
          (reciterMatch ? (wasCorrected ? 8 : 4) : 0) +
          item.views_count / 5000 +
          item.saves_count / 2000;

        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);
  }, [effectiveQuery, sourceMedia, wasCorrected]);

  useEffect(() => {
    if (!effectiveQuery) return;
    void logSearch(effectiveQuery, results.length);
  }, [effectiveQuery, results.length]);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <h1 className="text-3xl font-black">نتائج البحث الذكي</h1>
        <SearchBar initial={q} />

        {!q && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold">عمليات بحث شائعة</h2>
            <div className="flex flex-wrap gap-2">
              {dbPopular.map((s) => (
                <span key={s} className="rounded-full bg-accent px-3 py-1 text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}

        {!!q && <p className="text-muted-foreground">{results.length} نتيجة لعبارة: <span className="text-foreground">{effectiveQuery || q}</span></p>}

        {wasCorrected && (
          <p className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            تم تصحيح البحث تلقائيًا إلى: <span className="font-semibold text-foreground">{effectiveQuery}</span>
          </p>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : results.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((item) => <MediaCard key={item.id} item={item} />)}
          </div>
        ) : effectiveQuery ? (
          <div className="space-y-4 rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <p>لا توجد نتائج مطابقة لعبارة البحث.</p>
            <Button variant="outline" onClick={() => window.history.back()}>الرجوع للصفحة السابقة</Button>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
};

export default SearchResultsPage;
