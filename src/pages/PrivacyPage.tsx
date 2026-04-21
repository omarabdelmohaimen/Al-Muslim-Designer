import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";

const PrivacyPage = () => {
  useSeo({ title: "سياسة الخصوصية | المسلم المصمم", description: "خصوصية بيانات المستخدم في منصة المسلم المصمم", canonicalPath: "/privacy" });

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-black">سياسة الخصوصية</h1>
        <p className="text-muted-foreground">نلتزم بحماية بياناتك، ولا نشارك المعلومات الشخصية مع أي طرف ثالث خارج متطلبات التشغيل الأساسية.</p>
      </section>
    </AppShell>
  );
};

export default PrivacyPage;
