import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Share2 } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { MediaCard } from "@/components/site/MediaCard";
import { addRecent } from "@/lib/storage";
import { useSeo } from "@/hooks/use-seo";
import { toast } from "@/hooks/use-toast";
import { fetchPublishedMedia } from "@/lib/media-db";
import { MediaItem } from "@/types/media";
import { Skeleton } from "@/components/ui/skeleton";

const VideoDetailPage = () => {
  const { slug = "" } = useParams();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMediaList(await fetchPublishedMedia());
      setLoading(false);
    };
    void load();
  }, []);

  const media = useMemo(() => mediaList.find((item) => item.slug === slug), [mediaList, slug]);

  useSeo({
    title: `${media?.title_ar ?? "تفاصيل الفيديو"} | المسلم المصمم`,
    description: media?.description_ar ?? "تفاصيل فيديو قرآني",
    canonicalPath: `/video/${slug}`,
  });

  useEffect(() => {
    if (media) addRecent(media.id);
  }, [media]);

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl space-y-6 px-4 py-10">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-80 rounded-lg" />
        </section>
      </AppShell>
    );
  }

  if (!media) {
    return (
      <AppShell>
        <section className="mx-auto max-w-4xl rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">المحتوى غير موجود أو غير منشور.</section>
      </AppShell>
    );
  }

  const related = mediaList.filter((i) => i.id !== media.id && i.category === media.category).slice(0, 3);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <h1 className="text-3xl font-black leading-relaxed">{media.title_ar}</h1>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <article className="space-y-4 rounded-lg border border-border bg-card p-4">
            <video controls preload="metadata" poster={media.thumbnail_url} className="h-auto w-full rounded-md" src={media.video_url} />
            <p className="text-muted-foreground">{media.description_ar}</p>

            <div className="grid gap-2 rounded-md border border-border bg-background p-4 text-sm">
              <p><strong>القارئ:</strong> {media.reciter || "-"}</p>
              <p><strong>السورة:</strong> {media.surah || "-"}</p>
              <p><strong>المدة:</strong> {Math.floor(media.duration_seconds / 60)} دقيقة</p>
              <p><strong>الدقة:</strong> {media.resolution}</p>
              <p><strong>الصيغة:</strong> {media.file_type}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={media.video_url} download className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Download className="h-4 w-4" /> تحميل
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "تم نسخ الرابط" });
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm"
              >
                <Share2 className="h-4 w-4" /> مشاركة
              </button>
            </div>
          </article>

          <aside className="space-y-4 rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-bold">وسوم</h2>
            <div className="flex flex-wrap gap-2">
              {media.tags.map((t) => <span key={t} className="rounded-full bg-accent px-2 py-1 text-xs">#{t}</span>)}
            </div>
          </aside>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold">محتوى مرتبط</h2>
          {related.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => <MediaCard key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">لا يوجد محتوى مرتبط حالياً.</div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default VideoDetailPage;
