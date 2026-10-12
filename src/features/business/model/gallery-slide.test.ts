import {
  altTextsOf,
  canActivate,
  contentTypeOf,
  galleryAltTextsSchema,
  moveSlideToIndex,
  nextSurfaces,
  reorderSlideIds,
  type GallerySlide,
} from './gallery-slide';

const slide = (overrides: Partial<GallerySlide> = {}): GallerySlide => ({
  id: 'slide-1',
  sortOrder: 0,
  isActive: false,
  objectKey: 'gallery/1.jpg',
  width: 1200,
  height: 800,
  contentVersion: 'v1',
  publicSurfaces: ['app', 'web'],
  previewUrl: 'https://cdn.example/1.jpg',
  translations: [
    { locale: 'es', altText: 'Salón' },
    { locale: 'ca', altText: 'Saló' },
    { locale: 'en', altText: 'Salon' },
  ],
  ...overrides,
});

describe('gallery slide', () => {
  it('requires image dimensions, a content version, and alts in es/ca/en to activate', () => {
    expect(canActivate(slide())).toBe(true);
    expect(canActivate(slide({ width: 0 }))).toBe(false);
    expect(canActivate(slide({ contentVersion: '' }))).toBe(false);
    expect(canActivate(slide({ translations: [{ locale: 'es', altText: 'Solo' }] }))).toBe(false);
  });

  it('builds alt drafts for every business locale', () => {
    expect(altTextsOf(slide({ translations: [{ locale: 'es', altText: 'A' }] }))).toEqual({
      es: 'A',
      ca: '',
      en: '',
    });
  });

  it('rejects blank alt texts', () => {
    const result = galleryAltTextsSchema.safeParse({ es: 'ok', ca: ' ', en: 'ok' });
    expect(result.success).toBe(false);
  });

  it('detects jpeg/png/webp from type or extension', () => {
    expect(contentTypeOf(new File([], 'a.jpg', { type: 'image/jpeg' }))).toBe('image/jpeg');
    expect(contentTypeOf(new File([], 'a.PNG', { type: '' }))).toBe('image/png');
    expect(contentTypeOf(new File([], 'a.webp', { type: 'image/webp' }))).toBe('image/webp');
    expect(contentTypeOf(new File([], 'a.gif', { type: 'image/gif' }))).toBeNull();
  });

  it('swaps adjacent slides and refuses moving past the ends', () => {
    const slides = [slide({ id: 'a' }), slide({ id: 'b' }), slide({ id: 'c' })];
    expect(reorderSlideIds(slides, 'b', 'up')).toEqual(['b', 'a', 'c']);
    expect(reorderSlideIds(slides, 'b', 'down')).toEqual(['a', 'c', 'b']);
    expect(reorderSlideIds(slides, 'a', 'up')).toBeNull();
    expect(reorderSlideIds(slides, 'c', 'down')).toBeNull();
  });

  it('moves a slide to an absolute index for drag-and-drop', () => {
    const slides = [slide({ id: 'a' }), slide({ id: 'b' }), slide({ id: 'c' })];
    expect(moveSlideToIndex(slides, 'a', 2)).toEqual(['b', 'c', 'a']);
    expect(moveSlideToIndex(slides, 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(moveSlideToIndex(slides, 'b', 1)).toBeNull();
  });

  it('keeps at least one public surface', () => {
    expect(nextSurfaces(['app', 'web'], 'web', false)).toEqual(['app']);
    expect(nextSurfaces(['app'], 'app', false)).toBeNull();
    expect(nextSurfaces(['app'], 'web', true)).toEqual(['app', 'web']);
  });
});
