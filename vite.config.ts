import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { webcrypto } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const cryptoSubtle = globalThis.crypto?.subtle ?? webcrypto.subtle;

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha1Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await cryptoSubtle.digest('SHA-1', encoded);
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

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  resource_type?: 'image' | 'video';
  result?: string | number;
  [key: string]: unknown;
};

type CloudinaryDestroyResponse = {
  result?: string;
  [key: string]: unknown;
};

function json(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

function cloudinaryLocalApiPlugin(env: Record<string, string | undefined>): Plugin {
  const getEnv = (key: string, fallback = '') => env[key] || fallback;

  return {
    name: 'cloudinary-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        try {
          const url = req.url || '';
          if (req.method !== 'POST' || (url !== '/api/cloudinary-upload' && url !== '/api/cloudinary-delete')) {
            return next();
          }

          const origin = `http://${req.headers.host || 'localhost'}`;
          const request = new Request(`${origin}${url}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: req as any,
            duplex: 'half',
          });

          const cloudName = getEnv('CLOUDINARY_CLOUD_NAME');
          const apiKey = getEnv('CLOUDINARY_API_KEY');
          const apiSecret = getEnv('CLOUDINARY_API_SECRET');
          const videoFolder = getEnv('CLOUDINARY_VIDEO_FOLDER', 'amm/videos');
          const thumbnailFolder = getEnv('CLOUDINARY_THUMBNAIL_FOLDER', 'amm/thumbnails');

          if (!cloudName || !apiKey || !apiSecret) {
            return json(res, 500, { error: 'Missing Cloudinary environment variables' });
          }

          if (url === '/api/cloudinary-upload') {
            const formData = await request.formData();
            const file = formData.get('file');
            const kind = String(formData.get('kind') || 'video');

            if (!(file instanceof File)) {
              return json(res, 400, { error: 'file is required' });
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

            const uploadJson = (await uploadRes.json()) as CloudinaryUploadResponse;
            const publicId = normalizeParamValue(uploadJson.public_id);
            const secureUrl = normalizeParamValue(uploadJson.secure_url);

            if (!uploadRes.ok || !publicId || !secureUrl) {
              return json(res, 500, { error: 'Upload failed', kind, details: uploadJson });
            }

            return json(res, 200, {
              ok: true,
              kind,
              publicId,
              secureUrl,
              resourceType,
              upload: uploadJson,
            });
          }

          if (url === '/api/cloudinary-delete') {
            const body = (await request.json()) as { fileId?: string; resourceType?: 'image' | 'video' };
            const publicId = String(body.fileId || '').trim();
            const resourceType = body.resourceType === 'video' ? 'video' : 'image';

            if (!publicId) {
              return json(res, 400, { error: 'fileId is required' });
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

            const destroyRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
              method: 'POST',
              body: formData,
            });

            const payload = (await destroyRes.json()) as CloudinaryDestroyResponse;
            if (!destroyRes.ok || (payload.result !== 'ok' && payload.result !== 'not found')) {
              return json(res, 500, { error: 'Delete failed', fileId: publicId, details: payload });
            }

            return json(res, 200, { ok: true, fileId: publicId, details: payload, resourceType });
          }
        } catch (error: any) {
          return json(res, 500, { error: error?.message || 'Unexpected local API error' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      open: false,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), cloudinaryLocalApiPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query', '@tanstack/query-core'],
    },
  };
});
