import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminRolesPage = () => {
  useSeo({ title: "إدارة المشرفين | المسلم المصمم", description: "إدارة صلاحيات المشرفين", canonicalPath: "/private-portal-amm/roles" });

  const [rows, setRows] = useState<{ id: string; user_id: string; role: "admin" | "moderator" | "user"; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "moderator">("moderator");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; user_id: string; role: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("user_roles").select("id,user_id,role,created_at").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "فشل تحميل الصلاحيات", description: error.message });
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((r) => `${r.user_id} ${r.role}`.toLowerCase().includes(normalized));
  }, [rows, query]);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-black">إدارة المشرفين</h1>

        <form
          className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!userId.trim()) return;

            setAdding(true);
            const { error } = await supabase.from("user_roles").insert({ user_id: userId.trim(), role });
            setAdding(false);

            if (error) {
              toast({ title: "فشل الإضافة", description: error.message });
              return;
            }

            toast({ title: "تمت إضافة الصلاحية" });
            setUserId("");
            await load();
          }}
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="user_id">User ID</Label>
            <Input id="user_id" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID للمستخدم" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">الدور</Label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "moderator")} className="h-10 w-full rounded-md border border-input bg-background px-3">
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button disabled={adding} className="w-full">{adding ? "جارٍ الإضافة..." : "إضافة صلاحية"}</Button>
          </div>
        </form>

        <div className="rounded-lg border border-border bg-card p-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بـ user id أو الدور" />
          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="w-[120px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.user_id}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleDateString("ar-EG")}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => setDeleting(row)}>حذف</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الصلاحية</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف هذا الدور من المستخدم المحدد.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                const { error } = await supabase.from("user_roles").delete().eq("id", deleting.id);
                if (error) {
                  toast({ title: "فشل الحذف", description: error.message });
                  return;
                }

                toast({ title: "تم حذف الصلاحية" });
                setDeleting(null);
                await load();
              }}
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default AdminRolesPage;
