import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Index from "./pages/Index.tsx";
import LibraryPage from "./pages/LibraryPage";
import QuranVideosPage from "./pages/QuranVideosPage";
import IslamicDesignsPage from "./pages/IslamicDesignsPage";
import ChromaPage from "./pages/ChromaPage";
import CategoriesPage from "./pages/CategoriesPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FavoritesPage from "./pages/FavoritesPage";
import VideoDetailPage from "./pages/VideoDetailPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import UploadManagementPage from "./pages/admin/UploadManagementPage";
import VideoManagementPage from "./pages/admin/VideoManagementPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminRecitersPage from "./pages/admin/AdminRecitersPage";
import AdminSurahsPage from "./pages/admin/AdminSurahsPage";
import AdminTagsPage from "./pages/admin/AdminTagsPage";
import AdminSiteSettingsPage from "./pages/admin/AdminSiteSettingsPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminQuranMediaPage from "./pages/admin/AdminQuranMediaPage";
import AdminDesignsMediaPage from "./pages/admin/AdminDesignsMediaPage";
import AdminChromaMediaPage from "./pages/admin/AdminChromaMediaPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/quran-videos" element={<QuranVideosPage />} />
            <Route path="/islamic-designs" element={<IslamicDesignsPage />} />
            <Route path="/chroma" element={<ChromaPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/video/:slug" element={<VideoDetailPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route path="/auth/admin-login" element={<AdminLoginPage />} />
            <Route
              path="/private-portal-amm/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/uploads"
              element={
                <AdminRoute>
                  <UploadManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/videos"
              element={
                <AdminRoute>
                  <VideoManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/categories"
              element={
                <AdminRoute>
                  <AdminCategoriesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/reciters"
              element={
                <AdminRoute>
                  <AdminRecitersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/surahs"
              element={
                <AdminRoute>
                  <AdminSurahsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/tags"
              element={
                <AdminRoute>
                  <AdminTagsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/settings"
              element={
                <AdminRoute>
                  <AdminSiteSettingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/roles"
              element={
                <AdminRoute>
                  <AdminRolesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/media/quran"
              element={
                <AdminRoute>
                  <AdminQuranMediaPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/media/designs"
              element={
                <AdminRoute>
                  <AdminDesignsMediaPage />
                </AdminRoute>
              }
            />
            <Route
              path="/private-portal-amm/media/chroma"
              element={
                <AdminRoute>
                  <AdminChromaMediaPage />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
