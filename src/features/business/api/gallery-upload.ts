import { apiClient, unwrap } from '@/shared/api';

import type { GalleryContentType } from '../model/gallery-slide';
import { toGallerySlide } from './business.mappers';

/** Hop-by-hop and browser-forbidden headers the presign may echo; a browser PUT must not set them. */
const FORBIDDEN_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'proxy-connection',
  'te',
  'trailer',
  'upgrade',
]);

function filteredHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (!FORBIDDEN_HEADERS.has(key.toLowerCase())) next[key] = value;
  }
  return next;
}

/**
 * Upload a gallery image: request a presigned URL, PUT the bytes without the panel JWT, then
 * confirm the object key. Matches Flutter's `uploadBytesToPresignedUrl` + confirm flow.
 */
export async function uploadGallerySlideImage(slideId: string, file: File, contentType: GalleryContentType) {
  const instructions = unwrap(
    await apiClient.POST('/admin/home-gallery/slides/{id}/upload-url', {
      params: { path: { id: slideId } },
      body: { contentType },
    }),
  );

  const uploadUrl = instructions.uploadUrl ?? '';
  const objectKey = instructions.objectKey ?? '';
  const method = (instructions.method ?? 'PUT').toUpperCase();
  if (!uploadUrl || !objectKey) {
    throw new Error('Gallery upload URL response is incomplete');
  }
  if (method !== 'PUT') {
    throw new Error(`Unsupported upload method: ${method}`);
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: filteredHeaders(instructions.headers),
    body: file,
  });
  if (!response.ok) {
    const message = (await response.text()).trim() || 'Upload failed';
    throw new Error(message);
  }

  return toGallerySlide(
    unwrap(
      await apiClient.PUT('/admin/home-gallery/slides/{id}/confirm', {
        params: { path: { id: slideId } },
        body: { objectKey },
      }),
    ),
  );
}
