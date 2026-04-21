import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { SearchBar } from "@/components/site/SearchBar";
import { MediaCard } from "@/components/site/MediaCard";
import { useSeo } from "@/hooks/use-seo";
import { MediaItem } from "@/types/media";
import { fetchActiveCategories, fetchPublishedMedia } from "@/lib/media-db";

const Index = () => {
  useSeo({
    title: "المسلم المصمم | مكتبة الوسائط الإسلامية الفاخرة",
    description: "أكبر مكتبة مرئية للقرآن والتصاميم الإسلامية والكروما بجودة عالية وبحث ذكي.",
    canonicalPath: "/",
  });

  const [dbMedia, setDbMedia] = useState<MediaItem[]>([]);
  const [dbCategories, setDbCategories] = useState<{ id: string; name_ar: string; description_ar?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeMedia = async () => {
      setLoading(true);
      const [media, cats] = await Promise.all([fetchPublishedMedia(), fetchActiveCategories()]);
      setDbMedia(media);
      setDbCategories(cats);
      setLoading(false);
    };

    void loadHomeMedia();
  }, []);

  const sourceMedia = useMemo(() => dbMedia, [dbMedia]);
  const featured = sourceMedia.filter((x) => x.is_featured).slice(0, 3);
  const latest = [...sourceMedia].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);
  const popular = [...sourceMedia].sort((a, b) => b.views_count - a.views_count).slice(0, 6);

  return (
    <AppShell>
      <section className="relative overflow-visible border-b border-border/70 bg-card/40 font-arabic">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,hsl(var(--primary))_0,transparent_65%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div className="space-y-7">
            <p className="inline-flex rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary">منصة إسلامية فاخرة للمبدعين</p>
            <h1 className="text-4xl font-black leading-tight text-foreground md:text-6xl">المسلم المصمم</h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              أكبر مكتبة مرئية إسلامية لفيديوهات القرآن، التلاوات، التصاميم الراقية، والكروما الاحترافية — منظمة بعناية لتخدم صُنّاع المحتوى.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/library" className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">استكشف المكتبة</Link>
              <Link to="/quran-videos" className="rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent">ابحث في فيديوهات القرآن</Link>
            </div>
          </div>

          <div className="relative z-[130] rounded-2xl border border-border bg-background/85 p-6 shadow-xl shadow-primary/10">
            <h2 className="mb-4 text-lg font-bold">البحث الذكي</h2>
            <p className="mb-4 text-sm text-muted-foreground">اكتب من أول حرف واحصل على اقتراحات مباشرة.</p>
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 font-arabic">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">التصنيفات المميزة</h2>
          <Link to="/categories" className="text-sm text-primary hover:underline">عرض الكل</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dbCategories.map((cat) => (
            <article key={cat.id} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-primary/10">
              <h3 className="text-lg font-bold">{cat.name_ar}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{cat.description_ar || "محتوى نظيف، منظم، وجاهز للاستخدام الإبداعي."}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-2 font-arabic">
        <h2 className="text-2xl font-black">أحدث الرفع</h2>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg border border-border bg-card" />)}
          </div>
        ) : latest.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {latest.map((item) => <MediaCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">لا يوجد محتوى منشور بعد.</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 font-arabic">
        <h2 className="text-2xl font-black">الأكثر مشاهدة</h2>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg border border-border bg-card" />)}
          </div>
        ) : popular.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {popular.map((item) => <MediaCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">لا توجد عناصر شائعة حالياً.</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 font-arabic">
        <article className="rounded-2xl border border-border bg-card/70 p-8 shadow-sm">
          <h2 className="text-2xl font-black">رسالتنا</h2>
          <p className="mt-3 max-w-4xl leading-relaxed text-muted-foreground">
            نُسهّل على المصممين والمونتيرين وصُنّاع المحتوى الإسلامي الوصول إلى مواد قرآنية بصرية عالية الجودة، مع تنظيم احترافي يوفّر الوقت ويرفع جودة الإنتاج.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg border border-border bg-card" />)
            ) : featured.length ? (
              featured.map((item) => <MediaCard key={item.id} item={item} />)
            ) : (
              <p className="text-muted-foreground md:col-span-3">لا توجد عناصر مميزة حالياً.</p>
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
};

export default Index;
