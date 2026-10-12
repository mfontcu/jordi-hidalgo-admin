import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  createGallerySlide,
  deleteGallerySlide,
  reorderGallerySlides,
  setGallerySlides,
  updateGallerySlideAlts,
  updateGallerySlideStatus,
  updateGallerySlideSurfaces,
  uploadGalleryImage,
} from '../api/business.mutations';
import {
  altTextsOf,
  canActivate,
  contentTypeOf,
  moveSlideToIndex,
  nextSurfaces,
  reorderSlideIds,
  type GalleryAltTextsInput,
  type GallerySlide,
} from '../model/gallery-slide';
import type { PublicSurface } from '../model/locales';

type Feedback = {
  onCreated: () => void;
  onCreateError: (error: unknown) => void;
  onStatusSaved: () => void;
  onStatusError: (error: unknown) => void;
  onActivateBlocked: () => void;
  onSurfacesSaved: () => void;
  onSurfacesError: (error: unknown) => void;
  onAltsSaved: () => void;
  onAltsError: (error: unknown) => void;
  onOrderSaved: () => void;
  onOrderError: (error: unknown) => void;
  onUploaded: () => void;
  onUploadError: (error: unknown) => void;
  onPickError: () => void;
  onDeleted: () => void;
  onDeleteError: (error: unknown) => void;
};

/**
 * Home gallery: create, status (gated by canActivate), surfaces, alts, reorder, upload, delete.
 */
export function useGallery(slides: GallerySlide[], feedback: Feedback) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [altDrafts, setAltDrafts] = useState<Record<string, GalleryAltTextsInput>>({});

  const altsOf = (slide: GallerySlide) => altDrafts[slide.id] ?? altTextsOf(slide);

  const create = useMutation({
    mutationFn: () => createGallerySlide(queryClient),
    onSuccess: feedback.onCreated,
    onError: feedback.onCreateError,
  });

  const status = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateGallerySlideStatus(queryClient, id, isActive),
    onSuccess: feedback.onStatusSaved,
    onError: feedback.onStatusError,
  });

  const surfaces = useMutation({
    mutationFn: ({ id, publicSurfaces }: { id: string; publicSurfaces: PublicSurface[] }) =>
      updateGallerySlideSurfaces(queryClient, id, publicSurfaces),
    onSuccess: feedback.onSurfacesSaved,
    onError: feedback.onSurfacesError,
  });

  const alts = useMutation({
    mutationFn: ({ id, values }: { id: string; values: GalleryAltTextsInput }) =>
      updateGallerySlideAlts(queryClient, id, values),
    onSuccess: (_data, { id }) => {
      setAltDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
      feedback.onAltsSaved();
    },
    onError: feedback.onAltsError,
  });

  const order = useMutation({
    mutationFn: (slideIds: string[]) => reorderGallerySlides(queryClient, slideIds),
    onSuccess: feedback.onOrderSaved,
    onError: feedback.onOrderError,
  });

  const upload = useMutation({
    mutationFn: ({
      id,
      file,
      contentType,
    }: {
      id: string;
      file: File;
      contentType: NonNullable<ReturnType<typeof contentTypeOf>>;
    }) => uploadGalleryImage(queryClient, id, file, contentType),
    onSuccess: feedback.onUploaded,
    onError: feedback.onUploadError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteGallerySlide(queryClient, id),
    onSuccess: () => {
      setDeletingId(null);
      feedback.onDeleted();
    },
    onError: (error) => {
      setDeletingId(null);
      feedback.onDeleteError(error);
    },
  });

  const applyOrder = (ids: string[]) => {
    const reordered = ids
      .map((id) => slides.find((item) => item.id === id))
      .filter((item): item is GallerySlide => item !== undefined);
    setGallerySlides(queryClient, reordered);
    order.mutate(ids);
  };

  return {
    slides,
    altsOf,
    setAlt: (slideId: string, locale: string, value: string) => {
      setAltDrafts((current) => {
        const slide = slides.find((item) => item.id === slideId);
        const base = current[slideId] ?? (slide ? altTextsOf(slide) : {});
        return { ...current, [slideId]: { ...base, [locale]: value } };
      });
    },
    create: () => {
      create.mutate();
    },
    isCreating: create.isPending,
    setActive: (slide: GallerySlide, isActive: boolean) => {
      if (isActive && !canActivate(slide)) {
        feedback.onActivateBlocked();
        return;
      }
      status.mutate({ id: slide.id, isActive });
    },
    isSavingStatus: (id: string) => status.isPending && status.variables.id === id,
    setSurface: (slide: GallerySlide, surface: PublicSurface, enabled: boolean) => {
      const next = nextSurfaces(slide.publicSurfaces, surface, enabled);
      if (!next) return;
      surfaces.mutate({ id: slide.id, publicSurfaces: next });
    },
    isSavingSurfaces: (id: string) => surfaces.isPending && surfaces.variables.id === id,
    saveAlts: (slide: GallerySlide) => {
      alts.mutate({ id: slide.id, values: altsOf(slide) });
    },
    isSavingAlts: (id: string) => alts.isPending && alts.variables.id === id,
    move: (slide: GallerySlide, direction: 'up' | 'down') => {
      const ids = reorderSlideIds(slides, slide.id, direction);
      if (!ids) return;
      applyOrder(ids);
    },
    /** Drop a dragged slide onto `toIndex` (0-based). */
    moveToIndex: (slideId: string, toIndex: number) => {
      const ids = moveSlideToIndex(slides, slideId, toIndex);
      if (!ids) return;
      applyOrder(ids);
    },
    isReordering: order.isPending,
    pickImage: (slide: GallerySlide, file: File | undefined) => {
      if (!file) return;
      const contentType = contentTypeOf(file);
      if (!contentType) {
        feedback.onPickError();
        return;
      }
      upload.mutate({ id: slide.id, file, contentType });
    },
    isUploading: (id: string) => upload.isPending && upload.variables.id === id,
    deletingId,
    askDelete: (id: string) => {
      setDeletingId(id);
    },
    cancelDelete: () => {
      setDeletingId(null);
    },
    confirmDelete: () => {
      if (deletingId) remove.mutate(deletingId);
    },
    isDeleting: remove.isPending,
  };
}
