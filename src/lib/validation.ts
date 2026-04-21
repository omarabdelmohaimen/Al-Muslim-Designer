export type FieldErrors = Record<string, string>;

export const sanitizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const getDuplicateSlugMessage = () => "هذا الرابط مستخدم بالفعل، اختر رابطًا مختلفًا.";

export const translateDatabaseError = (message?: string) => {
  if (!message) return "حدث خطأ غير متوقع، حاول مرة أخرى.";

  const normalized = message.toLowerCase();
  if (
    normalized.includes("duplicate key") ||
    normalized.includes("unique") ||
    normalized.includes("slug_unique_idx")
  ) {
    return getDuplicateSlugMessage();
  }

  return message;
};

export const validateMediaInput = (input: {
  title_ar: string;
  slug: string;
  description_ar?: string;
  duration_seconds: number;
  resolution: string;
  file_type: string;
}) => {
  const errors: FieldErrors = {};

  if (!input.title_ar.trim()) {
    errors.title_ar = "العنوان مطلوب.";
  } else if (input.title_ar.trim().length > 160) {
    errors.title_ar = "العنوان يجب ألا يتجاوز 160 حرفًا.";
  }

  if (!input.slug) {
    errors.slug = "الرابط المختصر مطلوب.";
  } else if (input.slug.length < 2 || input.slug.length > 120) {
    errors.slug = "الرابط المختصر يجب أن يكون بين 2 و120 حرفًا.";
  }

  if ((input.description_ar || "").trim().length > 1000) {
    errors.description_ar = "الوصف يجب ألا يتجاوز 1000 حرف.";
  }

  const duration = Number(input.duration_seconds);
  if (!Number.isFinite(duration) || duration < 1 || duration > 86400) {
    errors.duration_seconds = "المدة يجب أن تكون بين ثانية واحدة و24 ساعة.";
  }

  if (!input.resolution.trim()) {
    errors.resolution = "الدقة مطلوبة.";
  } else if (input.resolution.trim().length > 24) {
    errors.resolution = "الدقة طويلة جدًا.";
  }

  if (!input.file_type.trim()) {
    errors.file_type = "نوع الملف مطلوب.";
  } else if (!/^[a-z0-9]{2,10}$/i.test(input.file_type.trim())) {
    errors.file_type = "نوع الملف غير صالح (مثل mp4 أو mov).";
  }

  return errors;
};
