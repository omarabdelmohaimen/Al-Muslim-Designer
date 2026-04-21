import { z } from "zod";
import { useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(1200),
});

const ContactPage = () => {
  useSeo({ title: "اتصل بنا | المسلم المصمم", description: "تواصل مع فريق المسلم المصمم", canonicalPath: "/contact" });

  const [form, setForm] = useState({ name: "", email: "", message: "" });

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-black">اتصل بنا</h1>

        <form
          className="space-y-4 rounded-lg border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = schema.safeParse(form);
            if (!parsed.success) {
              toast({ title: "تحقق من الحقول", description: "يرجى إدخال بيانات صحيحة." });
              return;
            }

            toast({ title: "تم إرسال رسالتك", description: "سنقوم بالرد عليك قريبًا بإذن الله." });
            setForm({ name: "", email: "", message: "" });
          }}
        >
          <input className="h-11 w-full rounded-md border border-input bg-background px-3" placeholder="الاسم" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input className="h-11 w-full rounded-md border border-input bg-background px-3" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <textarea className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2" placeholder="رسالتك" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">إرسال</button>
        </form>
      </section>
    </AppShell>
  );
};

export default ContactPage;
