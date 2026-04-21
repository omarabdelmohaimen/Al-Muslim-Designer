type CloudinaryDestroyResponse = {
  result?: string;
  [key: string]: unknown;
};

const getEnv = (env: Record<string, string | undefined>, key: string) => env[key] || '';

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

    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({ error: 'Missing Cloudinary environment variables' }, { status: 500 });
    }

    const body = (await request.json()) as { fileId?: string; resourceType?: 'image' | 'video' };
    const publicId = String(body.fileId || '').trim();
    const resourceType = body.resourceType === 'video' ? 'video' : 'image';

    if (!publicId) {
      return Response.json({ error: 'fileId is required' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, unknown> = {
      public_id: publicId,
      timestamp,
      invalidate: 'true',
    };
    const signature = await signPayload(params, apiSecret);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('invalidate', 'true');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: 'POST',
      body: formData,
    });

    const payload = (await parseJson<CloudinaryDestroyResponse>(res)) || {};
    if (!res.ok || (payload.result !== 'ok' && payload.result !== 'not found')) {
      return Response.json({ error: 'Delete failed', fileId: publicId, details: payload }, { status: 500 });
    }

    return Response.json({ ok: true, fileId: publicId, details: payload, resourceType });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Unexpected delete error' }, { status: 500 });
  }
}
