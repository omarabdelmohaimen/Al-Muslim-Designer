import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";

const AboutPage = () => {
  useSeo({ title: "عن المسلم المصمم", description: "رسالة منصة المسلم المصمم لدعم المبدعين الإسلاميين", canonicalPath: "/about" });

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl space-y-5 px-4 py-10">
        <h1 className="text-3xl font-black">عن المنصة</h1>
        <p className="text-muted-foreground">المسلم المصمم هي مكتبة وسائط إسلامية فاخرة تخدم صناع المحتوى والمصممين والمونتيرين بمواد قرآنية مرئية نظيفة ومنظمة وجاهزة للإبداع.</p>
        <p className="text-muted-foreground">رسالتنا: تمكين كل مبدع مسلم من الوصول السريع إلى محتوى مرئي قرآني عالي الجودة بروح جمالية راقية.</p>
      </section>
    </AppShell>
  );
};

export default AboutPage;
