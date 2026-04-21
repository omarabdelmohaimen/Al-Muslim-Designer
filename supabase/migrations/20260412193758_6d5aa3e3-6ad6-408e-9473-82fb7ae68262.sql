CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TYPE public.media_kind AS ENUM ('quran_video', 'islamic_design', 'chroma', 'nature_scene', 'other');

CREATE TYPE public.media_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE public.background_type AS ENUM ('nature', 'mosque', 'abstract', 'solid', 'chroma', 'mixed');

CREATE TYPE public.content_style AS ENUM ('cinematic', 'minimal', 'calligraphy', 'documentary', 'ambient', 'other');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.surahs (
  id SMALLINT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  transliteration TEXT,
  juz_start SMALLINT,
  ayah_count SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reciters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_ar TEXT NOT NULL,
  label_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  media_kind public.media_kind NOT NULL,
  media_status public.media_status NOT NULL DEFAULT 'draft',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  reciter_id UUID REFERENCES public.reciters(id) ON DELETE SET NULL,
  surah_id SMALLINT REFERENCES public.surahs(id) ON DELETE SET NULL,
  juz SMALLINT,
  clip_type TEXT,
  background_type public.background_type,
  content_style public.content_style,
  mood TEXT,
  language_code TEXT NOT NULL DEFAULT 'ar',
  aspect_ratio TEXT,
  duration_seconds INT,
  resolution TEXT,
  file_type TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  pcloud_video_file_id TEXT,
  pcloud_thumbnail_file_id TEXT,
  download_enabled BOOLEAN NOT NULL DEFAULT true,
  views_count BIGINT NOT NULL DEFAULT 0,
  saves_count BIGINT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.media_item_tags (
  media_item_id UUID NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (media_item_id, tag_id)
);

CREATE TABLE public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  language_code TEXT,
  results_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  site_name_ar TEXT NOT NULL DEFAULT 'المسلم المصمم',
  site_name_en TEXT NOT NULL DEFAULT 'Al-Muslim Al-Mosammem',
  site_tagline_ar TEXT,
  site_tagline_en TEXT,
  hero_title_ar TEXT,
  hero_subtitle_ar TEXT,
  seo_title_default TEXT,
  seo_description_default TEXT,
  contact_email TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  homepage_sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_row_only CHECK (id = true)
);

CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);
CREATE INDEX idx_reciters_name_ar ON public.reciters(name_ar);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_media_items_media_kind ON public.media_items(media_kind);
CREATE INDEX idx_media_items_status_visibility ON public.media_items(media_status, is_visible);
CREATE INDEX idx_media_items_category ON public.media_items(category_id);
CREATE INDEX idx_media_items_reciter ON public.media_items(reciter_id);
CREATE INDEX idx_media_items_surah ON public.media_items(surah_id);
CREATE INDEX idx_media_items_published_at ON public.media_items(published_at DESC);
CREATE INDEX idx_media_items_views ON public.media_items(views_count DESC);
CREATE INDEX idx_media_items_saves ON public.media_items(saves_count DESC);
CREATE INDEX idx_search_logs_normalized ON public.search_logs(normalized_query);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_media_views(_media_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.media_items
  SET views_count = views_count + 1
  WHERE id = _media_id
    AND media_status = 'published'
    AND is_visible = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_media_saves(_media_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.media_items
  SET saves_count = saves_count + 1
  WHERE id = _media_id
    AND media_status = 'published'
    AND is_visible = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_search(_query TEXT, _lang TEXT DEFAULT 'ar', _results INT DEFAULT 0)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := lower(trim(_query));
  IF normalized IS NULL OR length(normalized) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.search_logs (query_text, normalized_query, language_code, results_count)
  VALUES (_query, normalized, _lang, GREATEST(_results, 0));
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_surahs_updated_at
BEFORE UPDATE ON public.surahs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_reciters_updated_at
BEFORE UPDATE ON public.reciters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_media_items_updated_at
BEFORE UPDATE ON public.media_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view surahs"
ON public.surahs
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage surahs"
ON public.surahs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view reciters"
ON public.reciters
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage reciters"
ON public.reciters
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view tags"
ON public.tags
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tags"
ON public.tags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view published visible media"
ON public.media_items
FOR SELECT
USING (media_status = 'published' AND is_visible = true);

CREATE POLICY "Admins can manage media"
ON public.media_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view media tag mapping"
ON public.media_item_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.media_items mi
    WHERE mi.id = media_item_id
      AND mi.media_status = 'published'
      AND mi.is_visible = true
  )
);

CREATE POLICY "Admins can manage media tag mapping"
ON public.media_item_tags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert search logs"
ON public.search_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view search logs"
ON public.search_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage search logs"
ON public.search_logs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.site_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (id, site_name_ar, site_name_en, site_tagline_ar, site_tagline_en, hero_title_ar, hero_subtitle_ar, seo_title_default, seo_description_default)
VALUES (
  true,
  'المسلم المصمم',
  'Al-Muslim Al-Mosammem',
  'مكتبة إسلامية فاخرة للمرئيات القرآنية والتصاميم',
  'Premium Islamic media vault for Quran visuals and designs',
  'أكبر مكتبة مرئية قرآنية للمبدعين',
  'اكتشف فيديوهات القرآن والتصاميم الإسلامية بدقة عالية وتنظيم احترافي.',
  'المسلم المصمم | مكتبة الوسائط الإسلامية',
  'منصة فاخرة لتنظيم واكتشاف فيديوهات القرآن والتصاميم الإسلامية والمحتوى المرئي الإبداعي.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('media-vault', 'media-vault', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media files"
ON storage.objects
FOR SELECT
USING (bucket_id IN ('media-vault', 'thumbnails'));

CREATE POLICY "Admins upload media files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id IN ('media-vault', 'thumbnails')
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins update media files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id IN ('media-vault', 'thumbnails')
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id IN ('media-vault', 'thumbnails')
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins delete media files"
ON storage.objects
FOR DELETE
USING (
  bucket_id IN ('media-vault', 'thumbnails')
  AND public.has_role(auth.uid(), 'admin')
);