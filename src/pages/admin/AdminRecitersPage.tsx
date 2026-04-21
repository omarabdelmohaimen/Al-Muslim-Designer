import { EntityManagerPage } from "@/components/admin/EntityManagerPage";

const AdminRecitersPage = () => (
  <EntityManagerPage
    title="إدارة الشيوخ"
    description="إضافة وتعديل وحذف الشيوخ"
    canonicalPath="/private-portal-amm/reciters"
    table="reciters"
    fields={[
      { key: "name_ar", label: "الاسم العربي", type: "text", required: true, maxLength: 120 },
      { key: "name_en", label: "الاسم الإنجليزي", type: "text", maxLength: 120 },
      { key: "country", label: "الدولة", type: "text", maxLength: 80 },
      { key: "is_active", label: "نشط", type: "checkbox" },
    ]}
    columns={[
      { key: "name_ar", label: "الاسم" },
      { key: "country", label: "الدولة" },
      { key: "is_active", label: "الحالة", render: (row) => (row.is_active ? "نشط" : "معطل") },
    ]}
    initialValues={{ name_ar: "", name_en: "", country: "", is_active: true }}
    searchKeys={["name_ar", "name_en", "country"]}
    searchPlaceholder="ابحث باسم الشيخ"
    orderBy={{ column: "created_at", ascending: false }}
  />
);

export default AdminRecitersPage;
