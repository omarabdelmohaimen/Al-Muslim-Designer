# المصمم المسلم

واجهة React + Vite + Supabase لإدارة وعرض:
- فيديوهات القرآن
- التصاميم الإسلامية
- محتوى الكروما

## التشغيل المحلي

1. ثبّت الاعتمادات:
   ```bash
   npm install
   ```

2. أنشئ ملف البيئة:
   ```bash
   cp .env.example .env
   ```

3. ضع بيانات مشروع Supabase الخاص بك داخل `.env`.

4. شغّل المشروع:
   ```bash
   npm run dev
   ```

## قاعدة البيانات

ملفات Supabase موجودة داخل `supabase/migrations`.

لترحيل البيانات من مشروعك القديم إلى مشروع Supabase جديد، استخدم النسخ الاحتياطي/الاستعادة عبر Supabase CLI أو تصدير SQL ثم الاستيراد إلى المشروع الجديد.


## Cloudinary uploads

Admin uploads now go through Cloudflare Pages Functions at `/api/cloudinary-upload` and `/api/cloudinary-delete`. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in your Cloudflare Pages environment variables, and optionally customize `CLOUDINARY_VIDEO_FOLDER` and `CLOUDINARY_THUMBNAIL_FOLDER`.


## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and add your Cloudinary variables
3. Start the app: `npm run dev`
4. Open `http://localhost:5173`

If `localhost` refuses to connect, the dev server is not running yet or you are in the wrong folder.
# Al-Muslim-Designer
