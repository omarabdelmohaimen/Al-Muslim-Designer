import { MediaManagementPage } from "@/components/admin/MediaManagementPage";

const AdminQuranMediaPage = () => (
  <MediaManagementPage
    title="إدارة محتوى القرآن"
    description="إدارة فيديوهات القرآن فقط"
    canonicalPath="/private-portal-amm/media/quran"
    fixedKind="quran_video"
  />
);

export default AdminQuranMediaPage;
