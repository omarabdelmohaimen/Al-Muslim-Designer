import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/site/AppShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-xl shadow-primary/10">
          <h1 className="mb-2 text-6xl font-black text-primary">404</h1>
          <p className="mb-6 text-xl">الصفحة غير موجودة</p>
          <p className="mb-6 text-muted-foreground">الرابط الذي تحاول الوصول إليه غير متاح حالياً.</p>
          <a href="/" className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            العودة للرئيسية
          </a>
        </div>
      </div>
    </AppShell>
  );
};

export default NotFound;
