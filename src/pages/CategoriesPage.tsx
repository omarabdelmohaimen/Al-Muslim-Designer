import { useEffect, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";
import { fetchActiveCategories } from "@/lib/media-db";

const CategoriesPage = () => {
  useSeo({ title: "التصنيفات | المسلم المصمم", description: "استكشف تصنيفات المكتبة الإسلامية", canonicalPath: "/categories" });

  const [categories, setCategories] = useState<{ id: string; name_ar: string; description_ar?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setCategories(await fetchActiveCategories());
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-black">التصنيفات</h1>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-card" />)}
          </div>
        ) : categories.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <article key={cat.id} className="rounded-lg border border-border bg-card p-6 shadow-md shadow-primary/10">
                <h2 className="text-xl font-bold">{cat.name_ar}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{cat.description_ar || "محتوى منظم وسريع الوصول للمبدعين."}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">لا توجد تصنيفات متاحة حالياً.</div>
        )}
      </section>
    </AppShell>
  );
};

export default CategoriesPage;
