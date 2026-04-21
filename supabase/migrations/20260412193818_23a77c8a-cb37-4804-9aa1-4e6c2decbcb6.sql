DROP POLICY IF EXISTS "Authenticated users can insert search logs" ON public.search_logs;

CREATE POLICY "Authenticated users can insert search logs"
ON public.search_logs
FOR INSERT
TO authenticated
WITH CHECK (language_code IS NOT NULL AND char_length(query_text) BETWEEN 1 AND 300);