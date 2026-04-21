import { useEffect, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminSiteSettingsPage = () => {
  useSeo({ title: "إعدادات الموقع | المسلم المصمم", description: "إدارة إعدادات الموقع العامة", canonicalPath: "/private-portal-amm/settings" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name_ar: "",
    site_name_en: "",
    site_tagline_ar: "",
    site_tagline_en: "",
    hero_title_ar: "",
    hero_subtitle_ar: "",
    seo_title_default: "",
    seo_description_default: "",
    contact_email: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("site_name_ar,site_name_en,site_tagline_ar,site_tagline_en,hero_title_ar,hero_subtitle_ar,seo_title_default,seo_description_default,contact_email")
        .eq("id", true)
        .maybeSingle();

      if (error) {
        toast({ title: "فشل تحميل الإعدادات", description: error.message });
      } else if (data) {
        setForm({
          site_name_ar: data.site_name_ar ?? "",
          site_name_en: data.site_name_en ?? "",
          site_tagline_ar: data.site_tagline_ar ?? "",
          site_tagline_en: data.site_tagline_en ?? "",
          hero_title_ar: data.hero_title_ar ?? "",
          hero_subtitle_ar: data.hero_subtitle_ar ?? "",
          seo_title_default: data.seo_title_default ?? "",
          seo_description_default: data.seo_description_default ?? "",
          contact_email: data.contact_email ?? "",
        });
      }

      setLoading(false);
    };

    void load();
  }, []);

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-black">إعدادات الموقع</h1>

        {loading ? (
          <div className="space-y-2 rounded-lg border border-border bg-card p-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : (
          <form
            className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              const { error } = await supabase.from("site_settings").upsert({ id: true, ...form });
              setSaving(false);

              if (error) {
                toast({ title: "فشل الحفظ", description: error.message });
                return;
              }

              toast({ title: "تم حفظ إعدادات الموقع" });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="site_name_ar">اسم الموقع (عربي)</Label>
              <Input id="site_name_ar" value={form.site_name_ar} onChange={(e) => setForm((p) => ({ ...p, site_name_ar: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_name_en">اسم الموقع (English)</Label>
              <Input id="site_name_en" value={form.site_name_en} onChange={(e) => setForm((p) => ({ ...p, site_name_en: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline_ar">الشعار (عربي)</Label>
              <Input id="site_tagline_ar" value={form.site_tagline_ar} onChange={(e) => setForm((p) => ({ ...p, site_tagline_ar: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline_en">الشعار (English)</Label>
              <Input id="site_tagline_en" value={form.site_tagline_en} onChange={(e) => setForm((p) => ({ ...p, site_tagline_en: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hero_title_ar">عنوان الـHero</Label>
              <Input id="hero_title_ar" value={form.hero_title_ar} onChange={(e) => setForm((p) => ({ ...p, hero_title_ar: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hero_subtitle_ar">وصف الـHero</Label>
              <Textarea id="hero_subtitle_ar" value={form.hero_subtitle_ar} onChange={(e) => setForm((p) => ({ ...p, hero_subtitle_ar: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_title_default">SEO Title</Label>
              <Input id="seo_title_default" value={form.seo_title_default} onChange={(e) => setForm((p) => ({ ...p, seo_title_default: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">بريد التواصل</Label>
              <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="seo_description_default">SEO Description</Label>
              <Textarea id="seo_description_default" value={form.seo_description_default} onChange={(e) => setForm((p) => ({ ...p, seo_description_default: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <Button disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</Button>
            </div>
          </form>
        )}
      </section>
    </AppShell>
  );
};

export default AdminSiteSettingsPage;
