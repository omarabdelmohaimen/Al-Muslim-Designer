export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  resourceType: 'image' | 'video';
  raw: unknown;
}

type CloudinaryUploadResponse = {
  ok?: boolean;
  kind?: 'video' | 'thumbnail';
  publicId?: string;
  secureUrl?: string;
  resourceType?: 'image' | 'video';
  upload?: unknown;
  error?: string;
  details?: unknown;
};

type CloudinaryDeleteResponse = {
  ok?: boolean;
  error?: string;
  details?: unknown;
};

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || 'Unexpected response from the server.');
  }
}

export async function uploadFileToCloudinary(file: File, kind: 'video' | 'thumbnail') {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', file, file.name);

  const response = await fetch('/api/cloudinary-upload', {
    method: 'POST',
    body: formData,
  });

  const payload = (await parseJson<CloudinaryUploadResponse>(response)) || {};
  if (!response.ok || !payload.ok || !payload.publicId || !payload.secureUrl) {
    throw new Error('فشل رفع الملف إلى Cloudinary.');
  }

  return {
    publicId: payload.publicId,
    secureUrl: payload.secureUrl,
    resourceType: payload.resourceType || (kind === 'video' ? 'video' : 'image'),
    raw: payload.upload,
  } satisfies CloudinaryUploadResult;
}

export async function deleteCloudinaryFile(fileId: string, resourceType: 'image' | 'video' = 'image') {
  const response = await fetch('/api/cloudinary-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, resourceType }),
  });

  const payload = (await parseJson<CloudinaryDeleteResponse>(response)) || {};
  if (!response.ok || !payload.ok) {
    throw new Error('فشل حذف الملف من Cloudinary.');
  }
}
