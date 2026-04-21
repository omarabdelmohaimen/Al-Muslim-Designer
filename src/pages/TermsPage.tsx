import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";

const TermsPage = () => {
  useSeo({ title: "الشروط والأحكام | المسلم المصمم", description: "شروط استخدام منصة المسلم المصمم", canonicalPath: "/terms" });

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-black">الشروط والأحكام</h1>
        <p className="text-muted-foreground">باستخدامك للمنصة فإنك توافق على الاستخدام الأخلاقي للمحتوى واحترام الحقوق وسياسات النشر.</p>
      </section>
    </AppShell>
  );
};

export default TermsPage;
