import { Link, NavLink } from "react-router-dom";
import { Check, Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/library", label: "المكتبة" },
  { to: "/quran-videos", label: "فيديوهات القرآن" },
  { to: "/islamic-designs", label: "تصاميم إسلامية" },
  { to: "/chroma", label: "كروما" },
  { to: "/categories", label: "التصنيفات" },
  { to: "/favorites", label: "المحفوظات" },
  { to: "/about", label: "عن المنصة" },
  { to: "/contact", label: "اتصل بنا" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-[200] border-b border-border/70 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-xl font-extrabold text-primary">المسلم المصمم</span>
            <span className="text-xs text-muted-foreground">Al-Muslim Al-Mosammem</span>
          </Link>

          <Sheet>
            <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">فتح القائمة</span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88%] max-w-sm border-border bg-background px-4 pb-5 pt-14 sm:pt-14"
            >
              <div className="mb-4 rounded-lg border border-border bg-card/60 p-3 text-right">
                <SheetTitle className="text-base font-extrabold text-foreground">التنقل السريع</SheetTitle>
                <p className="mt-1 text-xs text-muted-foreground">اختر القسم المطلوب من نفس روابط الموقع الحالية.</p>
              </div>

              <nav className="flex flex-col gap-2">
                {links.map((link) => (
                  <SheetClose asChild key={`mobile-${link.to}`}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-lg border px-3 py-3 text-right text-sm transition-all duration-300 ${
                          isActive
                            ? "border-primary/50 bg-primary/15 text-primary shadow-sm motion-safe:animate-fade-in"
                            : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`transition-transform duration-300 ${
                              isActive ? "translate-x-0 font-semibold" : "translate-x-0.5"
                            }`}
                          >
                            {link.label}
                          </span>
                          <Check
                            className={`h-4 w-4 transition-all duration-300 ${
                              isActive ? "scale-100 opacity-100" : "scale-75 opacity-0"
                            }`}
                          />
                        </>
                      )}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-5 border-t border-border pt-4">
                <SheetClose asChild>
                  <Link
                    to="/search"
                    className="block rounded-lg border border-primary/40 bg-primary/15 px-3 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    بحث ذكي
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-4 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/search"
            className="hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent lg:inline-flex"
          >
            بحث ذكي
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-muted-foreground md:grid-cols-2">
          <p>منصة فاخرة لتنظيم واكتشاف المحتوى المرئي الإسلامي.</p>
          <div className="flex flex-wrap gap-4 md:justify-end">
            <Link to="/terms" className="hover:text-foreground">الشروط</Link>
            <Link to="/privacy" className="hover:text-foreground">الخصوصية</Link>
            <Link to="/auth/admin-login" className="hover:text-foreground">دخول الإدارة</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
