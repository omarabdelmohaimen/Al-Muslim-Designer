import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const AdminLoginPage = () => {
  useSeo({ title: "دخول الإدارة | المسلم المصمم", description: "بوابة الإدارة الآمنة", canonicalPath: "/auth/admin-login" });

  const navigate = useNavigate();
  const { user, isAdmin, refreshRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && isAdmin) return <Navigate to="/private-portal-amm/dashboard" replace />;

  return (
    <AppShell>
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-6 text-center text-3xl font-black">تسجيل دخول الإدارة</h1>
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (error) {
              setLoading(false);
              toast({ title: "فشل تسجيل الدخول", description: error.message });
              return;
            }

            await refreshRole();
            const { data } = await supabase.auth.getUser();
            const { data: rolesData } = await (supabase as any)
              .from("user_roles")
              .select("role")
              .eq("user_id", data.user?.id)
              .in("role", ["admin", "moderator"])
              .limit(1);

            setLoading(false);
            if (!rolesData?.length) {
              await supabase.auth.signOut();
              toast({ title: "غير مصرح", description: "هذا الحساب لا يملك صلاحية دخول لوحة الإدارة" });
              return;
            }

            toast({ title: "تم تسجيل الدخول" });
            navigate("/private-portal-amm/dashboard");
          }}
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="h-11 w-full rounded-md border border-input bg-background px-3" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="h-11 w-full rounded-md border border-input bg-background px-3" />
          <button disabled={loading} className="w-full rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70">{loading ? "جاري الدخول..." : "دخول"}</button>
        </form>
      </section>
    </AppShell>
  );
};

export default AdminLoginPage;
