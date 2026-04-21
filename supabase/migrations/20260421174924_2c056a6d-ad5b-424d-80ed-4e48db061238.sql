CREATE UNIQUE INDEX IF NOT EXISTS media_items_slug_unique_idx ON public.media_items (lower(slug));
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique_idx ON public.categories (lower(slug));
CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_unique_idx ON public.tags (lower(slug));