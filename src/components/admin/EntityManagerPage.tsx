import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { useSeo } from "@/hooks/use-seo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { getDuplicateSlugMessage, sanitizeSlug, translateDatabaseError } from "@/lib/validation";

type FieldType = "text" | "textarea" | "number" | "checkbox";

type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readonlyOnEdit?: boolean;
  min?: number;
  maxLength?: number;
};

type ColumnConfig = {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => string;
};

interface EntityManagerPageProps {
  title: string;
  description: string;
  canonicalPath: string;
  table: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  initialValues: Record<string, any>;
  searchKeys: string[];
  searchPlaceholder: string;
  selectColumns?: string;
  orderBy?: { column: string; ascending?: boolean };
}

export const EntityManagerPage = ({
  title,
  description,
  canonicalPath,
  table,
  fields,
  columns,
  initialValues,
  searchKeys,
  searchPlaceholder,
  selectColumns,
  orderBy,
}: EntityManagerPageProps) => {
  useSeo({ title: `${title} | المسلم المصمم`, description, canonicalPath });

  const hasSlugField = useMemo(() => fields.some((field) => field.key === "slug"), [fields]);

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, any> | null>(null);

  const load = async () => {
    setLoading(true);
    let req = (supabase as any).from(table).select(selectColumns || "*");
    if (orderBy) {
      req = req.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    const { data, error } = await req;
    if (error) {
      toast({ title: "فشل التحميل", description: translateDatabaseError(error.message) });
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter((row) =>
      searchKeys
        .map((k) => String(row[k] ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [rows, query, searchKeys]);

  const normalizePayload = (source: Record<string, any>) => {
    const payload: Record<string, any> = {};

    fields.forEach((field) => {
      let value = source[field.key];

      if (field.type === "number") {
        payload[field.key] = value === "" || value === null || value === undefined ? null : Number(value);
        return;
      }

      if (field.type === "checkbox") {
        payload[field.key] = Boolean(value);
        return;
      }

      if (typeof value === "string") {
        value = value.trim();
      }

      if (field.key === "slug" && typeof value === "string") {
        value = sanitizeSlug(value);
      }

      payload[field.key] = value;
    });

    return payload;
  };

  const validateForm = (payload: Record<string, any>) => {
    const nextErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = payload[field.key];

      if (field.required) {
        if (field.type === "checkbox") {
          if (!Boolean(value)) nextErrors[field.key] = `${field.label} مطلوب.`;
        } else if (value === null || value === undefined || String(value).trim() === "") {
          nextErrors[field.key] = `${field.label} مطلوب.`;
        }
      }

      if (field.type === "number" && value !== null && value !== undefined && value !== "") {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          nextErrors[field.key] = `${field.label} يجب أن يكون رقمًا صالحًا.`;
        } else if (field.min !== undefined && numeric < field.min) {
          nextErrors[field.key] = `${field.label} يجب ألا يقل عن ${field.min}.`;
        }
      }

      if (field.maxLength && typeof value === "string" && value.length > field.maxLength) {
        nextErrors[field.key] = `${field.label} يجب ألا يتجاوز ${field.maxLength} حرفًا.`;
      }
    });

    if (hasSlugField && payload.slug) {
      if (payload.slug.length < 2 || payload.slug.length > 120) {
        nextErrors.slug = "الرابط المختصر يجب أن يكون بين 2 و120 حرفًا.";
      }
    }

    return nextErrors;
  };

  const checkDuplicateSlug = async (slug: string) => {
    let req = (supabase as any).from(table).select("id").eq("slug", slug).limit(1);

    if (editing?.id) {
      req = req.neq("id", editing.id);
    }

    const { data, error } = await req;
    if (error) {
      throw error;
    }

    return Boolean(data && data.length > 0);
  };

  const onSave = async () => {
    setSaving(true);
    const payload = normalizePayload(form);
    const validationErrors = validateForm(payload);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    try {
      if (hasSlugField && payload.slug) {
        const isDuplicated = await checkDuplicateSlug(payload.slug);
        if (isDuplicated) {
          setErrors((prev) => ({ ...prev, slug: getDuplicateSlugMessage() }));
          setSaving(false);
          return;
        }
      }

      const req = editing
        ? (supabase as any).from(table).update(payload).eq("id", editing.id)
        : (supabase as any).from(table).insert(payload);

      const { error } = await req;

      if (error) {
        toast({ title: "فشل الحفظ", description: translateDatabaseError(error.message) });
        setSaving(false);
        return;
      }

      toast({ title: editing ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح" });
      setOpen(false);
      setEditing(null);
      setForm(initialValues);
      setErrors({});
      await load();
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: translateDatabaseError(error?.message) });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleting) return;

    const { error } = await (supabase as any).from(table).delete().eq("id", deleting.id);
    if (error) {
      toast({ title: "فشل الحذف", description: translateDatabaseError(error.message) });
      return;
    }

    toast({ title: "تم الحذف بنجاح" });
    setDeleting(null);
    await load();
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-black">{title}</h1>
          <div className="flex w-full gap-2 md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="h-10 ps-9" />
            </div>
            <Button
              className="h-10"
              onClick={() => {
                setEditing(null);
                setForm(initialValues);
                setErrors({});
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 rounded-lg border border-border bg-card p-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="space-y-4 rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <p>لا توجد بيانات حالياً.</p>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setForm(initialValues);
                setErrors({});
                setOpen(true);
              }}
            >
              إضافة عنصر جديد
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                  <TableHead className="w-[170px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={String(row.id)}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "-")}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(row);
                            setForm(fields.reduce((acc, field) => ({ ...acc, [field.key]: row[field.key] ?? initialValues[field.key] }), {}));
                            setErrors({});
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          تعديل
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleting(row)}>
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setErrors({});
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل" : "إضافة"}</DialogTitle>
            <DialogDescription>أدخل البيانات ثم احفظ التغييرات.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <>
                    <Textarea
                      id={field.key}
                      value={form[field.key] ?? ""}
                      onChange={(e) => {
                        const value = field.key === "slug" ? sanitizeSlug(e.target.value) : e.target.value;
                        setForm((prev) => ({ ...prev, [field.key]: value }));
                        setErrors((prev) => ({ ...prev, [field.key]: "" }));
                      }}
                    />
                    {errors[field.key] && <p className="text-xs text-destructive">{errors[field.key]}</p>}
                  </>
                ) : field.type === "checkbox" ? (
                  <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, [field.key]: e.target.checked }));
                        setErrors((prev) => ({ ...prev, [field.key]: "" }));
                      }}
                    />
                    مفعل
                  </label>
                ) : (
                  <>
                    <Input
                      id={field.key}
                      type={field.type}
                      min={field.min}
                      maxLength={field.maxLength}
                      required={field.required}
                      disabled={Boolean(editing && field.readonlyOnEdit)}
                      value={form[field.key] ?? ""}
                      onChange={(e) => {
                        const value = field.key === "slug" ? sanitizeSlug(e.target.value) : e.target.value;
                        setForm((prev) => ({ ...prev, [field.key]: value }));
                        setErrors((prev) => ({ ...prev, [field.key]: "" }));
                      }}
                    />
                    {errors[field.key] && <p className="text-xs text-destructive">{errors[field.key]}</p>}
                  </>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => void onSave()} disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف العنصر بشكل نهائي.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDelete()}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};
