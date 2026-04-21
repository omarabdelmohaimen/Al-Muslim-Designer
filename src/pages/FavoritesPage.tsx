import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { MediaCard } from "@/components/site/MediaCard";
import { getFavoriteIds, getRecentIds, mapByIds } from "@/lib/storage";
import { useSeo } from "@/hooks/use-seo";
import { fetchPublishedMedia } from "@/lib/media-db";
import { MediaItem } from "@/types/media";

const FavoritesPage = () => {
  useSeo({ title: "المحفوظات | المسلم المصمم", description: "العناصر المحفوظة والمشاهدة مؤخرًا", canonicalPath: "/favorites" });

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMedia(await fetchPublishedMedia());
      setLoading(false);
    };
    void load();
  }, []);

  const favorites = useMemo(() => mapByIds(media, getFavoriteIds()), [media]);
  const recent = useMemo(() => mapByIds(media, getRecentIds()), [media]);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-3xl font-black">المحفوظات</h1>
          <p className="mt-2 text-muted-foreground">كل العناصر التي قمت بحفظها على هذا الجهاز.</p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg border border-border bg-card" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.length ? favorites.map((item) => <MediaCard key={item.id} item={item} />) : <p className="text-muted-foreground">لا توجد عناصر محفوظة بعد.</p>}
          </div>
        )}

        <div>
          <h2 className="mb-4 text-2xl font-bold">شوهدت مؤخرًا</h2>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg border border-border bg-card" />)}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recent.length ? recent.map((item) => <MediaCard key={item.id} item={item} />) : <p className="text-muted-foreground">لا يوجد سجل مشاهدة حتى الآن.</p>}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default FavoritesPage;
