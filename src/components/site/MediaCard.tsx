import { Link } from "react-router-dom";
import { Bookmark, Clock3, Eye, Share2 } from "lucide-react";
import { MediaItem } from "@/types/media";
import { toggleFavorite } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

const formatDuration = (sec: number) => {
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, "0")}`;
};

export const MediaCard = ({ item }: { item: MediaItem }) => {
  return (
    <article className="group overflow-hidden rounded-lg border border-border/80 bg-card shadow-lg shadow-primary/10 transition-transform hover:-translate-y-1">
      <Link to={`/video/${item.slug}`}>
        <img src={item.thumbnail_url} alt={item.title_ar} loading="lazy" className="h-44 w-full object-cover" />
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.category}</span>
          <span className="rounded-full border border-border px-2 py-0.5">{item.resolution}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-bold leading-relaxed text-foreground">{item.title_ar}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description_ar}</p>

        <div className="flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-accent px-2 py-1 text-[11px] text-accent-foreground">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatDuration(item.duration_seconds)}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {item.views_count.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const state = toggleFavorite(item.id);
              toast({ title: state ? "تم الحفظ" : "تمت الإزالة", description: item.title_ar });
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"
          >
            <Bookmark className="h-4 w-4" /> حفظ
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/video/${item.slug}`);
              toast({ title: "تم نسخ الرابط" });
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"
          >
            <Share2 className="h-4 w-4" /> مشاركة
          </button>
        </div>
      </div>
    </article>
  );
};
