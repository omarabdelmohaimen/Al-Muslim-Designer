import { EntityManagerPage } from "@/components/admin/EntityManagerPage";

const AdminTagsPage = () => (
  <EntityManagerPage
    title="إدارة الوسوم"
    description="إضافة وتعديل وحذف الوسوم"
    canonicalPath="/private-portal-amm/tags"
    table="tags"
    fields={[
      { key: "label_ar", label: "الوسم العربي", type: "text", required: true, maxLength: 80 },
      { key: "slug", label: "Slug", type: "text", required: true, maxLength: 120 },
      { key: "label_en", label: "الوسم الإنجليزي", type: "text", maxLength: 80 },
    ]}
    columns={[
      { key: "label_ar", label: "الوسم" },
      { key: "slug", label: "Slug" },
      { key: "label_en", label: "English" },
    ]}
    initialValues={{ label_ar: "", slug: "", label_en: "" }}
    searchKeys={["label_ar", "label_en", "slug"]}
    searchPlaceholder="ابحث بالوسم أو slug"
    orderBy={{ column: "created_at", ascending: false }}
  />
);

export default AdminTagsPage;
