import { EntityManagerPage } from "@/components/admin/EntityManagerPage";

const AdminCategoriesPage = () => (
  <EntityManagerPage
    title="إدارة التصنيفات"
    description="إضافة وتعديل وحذف التصنيفات"
    canonicalPath="/private-portal-amm/categories"
    table="categories"
    fields={[
      { key: "name_ar", label: "الاسم العربي", type: "text", required: true, maxLength: 120 },
      { key: "slug", label: "Slug", type: "text", required: true, maxLength: 120 },
      { key: "name_en", label: "الاسم الإنجليزي", type: "text", maxLength: 120 },
      { key: "description_ar", label: "الوصف العربي", type: "textarea", maxLength: 500 },
      { key: "description_en", label: "الوصف الإنجليزي", type: "textarea", maxLength: 500 },
      { key: "icon", label: "الأيقونة", type: "text", maxLength: 60 },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "is_active", label: "نشط", type: "checkbox" },
      { key: "is_featured", label: "مميز", type: "checkbox" },
    ]}
    columns={[
      { key: "name_ar", label: "الاسم" },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "الترتيب" },
      { key: "is_active", label: "الحالة", render: (row) => (row.is_active ? "نشط" : "معطل") },
    ]}
    initialValues={{
      name_ar: "",
      slug: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      icon: "",
      sort_order: 0,
      is_active: true,
      is_featured: false,
    }}
    searchKeys={["name_ar", "slug", "name_en"]}
    searchPlaceholder="ابحث باسم التصنيف أو slug"
    orderBy={{ column: "sort_order", ascending: true }}
  />
);

export default AdminCategoriesPage;
