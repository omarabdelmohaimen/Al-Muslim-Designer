type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  resource_type?: 'image' | 'video';
  result?: string | number;
  [key: string]: unknown;
};

const getEnv = (env: Record<string, string | undefined>, key: string, fallback = '') => env[key] || fallback;

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

async function sha1Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', encoded);
  return toHex(digest);
}

function normalizeParamValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function buildSignatureString(params: Record<string, unknown>, apiSecret: string) {
  const entries = Object.entries(params)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (key === 'file' || key === 'cloud_name' || key === 'api_key' || key === 'resource_type' || key === 'signature') return false;
      return normalizeParamValue(value) !== null;
    })
    .map(([key, value]) => [key, normalizeParamValue(value)!] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  const query = entries.map(([key, value]) => `${key}=${value}`).join('&');
  return `${query}${apiSecret}`;
}

async function signPayload(params: Record<string, unknown>, apiSecret: string) {
  return sha1Hex(buildSignatureString(params, apiSecret));
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || 'Unexpected response from Cloudinary.');
  }
}

export async function onRequestPost(context: { request: Request; env: Record<string, string | undefined> }) {
  try {
    const { request, env } = context;
    const cloudName = getEnv(env, 'CLOUDINARY_CLOUD_NAME');
    const apiKey = getEnv(env, 'CLOUDINARY_API_KEY');
    const apiSecret = getEnv(env, 'CLOUDINARY_API_SECRET');
    const videoFolder = getEnv(env, 'CLOUDINARY_VIDEO_FOLDER', 'amm/videos');
    const thumbnailFolder = getEnv(env, 'CLOUDINARY_THUMBNAIL_FOLDER', 'amm/thumbnails');

    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({ error: 'Missing Cloudinary environment variables' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') || 'video');

    if (!(file instanceof File)) {
      return Response.json({ error: 'file is required' }, { status: 400 });
    }

    const resourceType = kind === 'thumbnail' ? 'image' : 'video';
    const folder = kind === 'thumbnail' ? thumbnailFolder : videoFolder;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, unknown> = { timestamp };
    if (folder) params.folder = folder;
    const signature = await signPayload(params, apiSecret);

    const uploadData = new FormData();
    uploadData.append('file', file, file.name);
    uploadData.append('api_key', apiKey);
    uploadData.append('timestamp', timestamp);
    uploadData.append('signature', signature);
    if (folder) uploadData.append('folder', folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: uploadData,
    });

    const uploadJson = (await parseJson<CloudinaryUploadResponse>(uploadRes)) || {};
    const publicId = normalizeParamValue(uploadJson.public_id);
    const secureUrl = normalizeParamValue(uploadJson.secure_url);

    if (!uploadRes.ok || !publicId || !secureUrl) {
      return Response.json(
        { error: 'Upload failed', kind, details: uploadJson },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      kind,
      publicId,
      secureUrl,
      resourceType,
      upload: uploadJson,
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || 'Unexpected upload error' },
      { status: 500 },
    );
  }
}
