import { EntityManagerPage } from "@/components/admin/EntityManagerPage";

const AdminSurahsPage = () => (
  <EntityManagerPage
    title="إدارة السور"
    description="إضافة وتعديل وحذف بيانات السور"
    canonicalPath="/private-portal-amm/surahs"
    table="surahs"
    fields={[
      { key: "id", label: "رقم السورة", type: "number", required: true, min: 1, readonlyOnEdit: true },
      { key: "name_ar", label: "الاسم العربي", type: "text", required: true, maxLength: 120 },
      { key: "name_en", label: "الاسم الإنجليزي", type: "text", maxLength: 120 },
      { key: "transliteration", label: "الترجمة الصوتية", type: "text", maxLength: 120 },
      { key: "ayah_count", label: "عدد الآيات", type: "number", min: 1 },
      { key: "juz_start", label: "بداية الجزء", type: "number", min: 1 },
    ]}
    columns={[
      { key: "id", label: "الرقم" },
      { key: "name_ar", label: "الاسم" },
      { key: "ayah_count", label: "عدد الآيات" },
      { key: "juz_start", label: "بداية الجزء" },
    ]}
    initialValues={{ id: "", name_ar: "", name_en: "", transliteration: "", ayah_count: "", juz_start: "" }}
    searchKeys={["id", "name_ar", "name_en", "transliteration"]}
    searchPlaceholder="ابحث برقم أو اسم السورة"
    orderBy={{ column: "id", ascending: true }}
  />
);

export default AdminSurahsPage;
