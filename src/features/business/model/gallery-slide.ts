import { z } from 'zod';

import { BUSINESS_LOCALES, orderedLocales, type PublicSurface } from './locales';

export const GALLERY_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type GalleryContentType = (typeof GALLERY_CONTENT_TYPES)[number];

export type GallerySlideTranslation = {
  locale: string;
  altText: string;
};

export type GallerySlide = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  objectKey: string;
  width: number;
  height: number;
  contentVersion: string;
  publicSurfaces: PublicSurface[];
  previewUrl: string;
  translations: GallerySlideTranslation[];
};

export type GalleryAltTextsInput = Record<string, string>;

export type GalleryAltTextsErrorKey = 'businessGalleryAltTextRequired';

export const galleryAltTextsSchema = z.record(z.string(), z.string()).superRefine((value, ctx) => {
  for (const locale of BUSINESS_LOCALES) {
    if (!(value[locale] ?? '').trim()) {
      ctx.addIssue({
        code: 'custom',
        path: [locale],
        message: 'businessGalleryAltTextRequired',
      });
    }
  }
});

export function altTextFor(slide: GallerySlide, locale: string): string {
  return slide.translations.find((item) => item.locale === locale)?.altText ?? '';
}

export function altTextsOf(slide: GallerySlide): GalleryAltTextsInput {
  const locales = orderedLocales([...slide.translations.map((item) => item.locale), ...BUSINESS_LOCALES]);
  const values: GalleryAltTextsInput = {};
  for (const locale of locales) {
    values[locale] = altTextFor(slide, locale);
  }
  return values;
}

/** Image present (version + dimensions) and non-empty alt in es/ca/en. */
export function canActivate(slide: GallerySlide): boolean {
  const hasImage = slide.contentVersion.trim().length > 0 && slide.width > 0 && slide.height > 0;
  if (!hasImage) return false;
  return BUSINESS_LOCALES.every((locale) => altTextFor(slide, locale).trim().length > 0);
}

export function contentTypeOf(file: File): GalleryContentType | null {
  const type = file.type.toLowerCase();
  if ((GALLERY_CONTENT_TYPES as readonly string[]).includes(type)) {
    return type as GalleryContentType;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return null;
}

/** Swap adjacent slides and return the new id order. */
export function reorderSlideIds(
  slides: GallerySlide[],
  id: string,
  direction: 'up' | 'down',
): string[] | null {
  const ids = slides.map((slide) => slide.id);
  const index = ids.indexOf(id);
  if (index < 0) return null;
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return null;
  const next = [...ids];
  const current = next[index];
  const other = next[target];
  if (current === undefined || other === undefined) return null;
  next[index] = other;
  next[target] = current;
  return next;
}

/** Move a slide to `toIndex` (0-based) for drag-and-drop; null when the order is unchanged. */
export function moveSlideToIndex(slides: GallerySlide[], id: string, toIndex: number): string[] | null {
  const ids = slides.map((slide) => slide.id);
  const from = ids.indexOf(id);
  if (from < 0 || toIndex < 0 || toIndex >= ids.length || from === toIndex) return null;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return null;
  next.splice(toIndex, 0, moved);
  return next;
}

export function nextSurfaces(
  current: PublicSurface[],
  surface: PublicSurface,
  enabled: boolean,
): PublicSurface[] | null {
  const set = new Set(current);
  if (enabled) set.add(surface);
  else set.delete(surface);
  if (set.size === 0) return null;
  return (['app', 'web'] as const).filter((item) => set.has(item));
}
