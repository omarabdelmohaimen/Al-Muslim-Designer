import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/site/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboardPage = () => {
  useSeo({ title: "لوحة الإدارة | المسلم المصمم", description: "إدارة المحتوى الإسلامي", canonicalPath: "/private-portal-amm/dashboard" });

  const { signOut } = useAuth();
  const [stats, setStats] = useState({
    media: 0,
    mediaPublished: 0,
    mediaDraft: 0,
    quran: 0,
    designs: 0,
    chroma: 0,
    categories: 0,
    reciters: 0,
    surahs: 0,
    tags: 0,
    searches7d: 0,
  });

  useEffect(() => {
    const load = async () => {
      const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [
        media,
        mediaPublished,
        mediaDraft,
        quran,
        designs,
        chroma,
        categories,
        reciters,
        surahs,
        tags,
        searches7d,
      ] = await Promise.all([
        (supabase as any).from("media_items").select("id", { count: "exact", head: true }),
        (supabase as any).from("media_items").select("id", { count: "exact", head: true }).eq("media_status", "published"),
        (supabase as any).from("media_items").select("id", { count: "exact", head: true }).eq("media_status", "draft"),
        (supabase as any).from("media_items").select("id", { count: "exact", head: true }).eq("media_kind", "quran_video"),
        (supabase as any).from("media_items").select("id", { count: "exact", head: true }).eq("media_kind", "islamic_design"),
        (supabase as any).from("media_items").select("id", { count: "exact", head: true }).eq("media_kind", "chroma"),
        (supabase as any).from("categories").select("id", { count: "exact", head: true }),
        (supabase as any).from("reciters").select("id", { count: "exact", head: true }),
        (supabase as any).from("surahs").select("id", { count: "exact", head: true }),
        (supabase as any).from("tags").select("id", { count: "exact", head: true }),
        (supabase as any).from("search_logs").select("id", { count: "exact", head: true }).gte("created_at", since7Days),
      ]);

      setStats({
        media: media.count || 0,
        mediaPublished: mediaPublished.count || 0,
        mediaDraft: mediaDraft.count || 0,
        quran: quran.count || 0,
        designs: designs.count || 0,
        chroma: chroma.count || 0,
        categories: categories.count || 0,
        reciters: reciters.count || 0,
        surahs: surahs.count || 0,
        tags: tags.count || 0,
        searches7d: searches7d.count || 0,
      });
    };

    void load();
  }, []);

  const cards = [
    { label: "إجمالي الوسائط", value: stats.media },
    { label: "المنشور", value: stats.mediaPublished },
    { label: "المسودات", value: stats.mediaDraft },
    { label: "فيديوهات القرآن", value: stats.quran },
    { label: "التصاميم", value: stats.designs },
    { label: "الكروما", value: stats.chroma },
    { label: "التصنيفات", value: stats.categories },
    { label: "القراء", value: stats.reciters },
    { label: "السور", value: stats.surahs },
    { label: "الوسوم", value: stats.tags },
    { label: "بحث آخر 7 أيام", value: stats.searches7d },
  ];

  const adminLinks = [
    { label: "إدارة التصنيفات", to: "/private-portal-amm/categories" },
    { label: "إدارة الشيوخ", to: "/private-portal-amm/reciters" },
    { label: "إدارة السور", to: "/private-portal-amm/surahs" },
    { label: "إدارة الوسوم", to: "/private-portal-amm/tags" },
    { label: "إعدادات الموقع", to: "/private-portal-amm/settings" },
    { label: "إدارة المشرفين", to: "/private-portal-amm/roles" },
    { label: "محتوى القرآن", to: "/private-portal-amm/media/quran" },
    { label: "محتوى التصاميم", to: "/private-portal-amm/media/designs" },
    { label: "محتوى الكروما", to: "/private-portal-amm/media/chroma" },
  ];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black">لوحة إدارة المسلم المصمم</h1>
          <div className="flex gap-2">
            <Link to="/private-portal-amm/uploads" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">إضافة محتوى</Link>
            <Link to="/private-portal-amm/videos" className="rounded-md border border-border px-4 py-2 text-sm font-semibold">إدارة كل المحتوى</Link>
            <button onClick={() => void signOut()} className="rounded-md border border-border px-4 py-2 text-sm">تسجيل الخروج</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article key={card.label} className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-primary">{card.value}</p>
            </article>
          ))}
        </div>

        <article className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold">أقسام الإدارة</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
};

export default AdminDashboardPage;
