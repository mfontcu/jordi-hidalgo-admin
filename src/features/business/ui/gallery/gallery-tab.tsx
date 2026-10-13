import { useRef, useState, type DragEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FormField,
  Icon,
  showErrorToast,
  showToast,
  StatusPill,
  Switch,
  Textarea,
} from '@/shared/ui';

import { useGallery } from '../../hooks/use-gallery';
import type { GallerySlide } from '../../model/gallery-slide';
import { BUSINESS_LOCALE_LABEL, BUSINESS_LOCALES } from '../../model/locales';
import { SurfacesChips } from '../shared/surfaces-chips';
import { textOf } from '../shared/labels';

type GalleryTabProps = { slides: GallerySlide[] };

/** Home gallery carousel: upload, alts, surfaces, reorder (buttons + drag), activate, delete. */
export function GalleryTab({ slides }: GalleryTabProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const gallery = useGallery(slides, {
    onCreated: () => {
      showToast(text('businessGallerySlideCreated'));
    },
    onCreateError: (error) => {
      showErrorToast(describeFailure(error, 'businessGallerySlideCreateError'));
    },
    onStatusSaved: () => {
      showToast(text('businessGallerySlideStatusSaved'));
    },
    onStatusError: (error) => {
      showErrorToast(describeFailure(error, 'businessGallerySlideStatusSaveError'));
    },
    onActivateBlocked: () => {
      showErrorToast(text('businessGalleryActivateError'));
    },
    onSurfacesSaved: () => {
      showToast(text('legalPublicSurfacesUpdated'));
    },
    onSurfacesError: (error) => {
      showErrorToast(describeFailure(error, 'legalPublicSurfacesError'));
    },
    onAltsSaved: () => {
      showToast(text('businessGalleryAltTextsSaved'));
    },
    onAltsError: (error) => {
      showErrorToast(describeFailure(error, 'businessGalleryAltTextsSaveError'));
    },
    onOrderSaved: () => {
      showToast(text('businessGalleryOrderSaved'));
    },
    onOrderError: (error) => {
      showErrorToast(describeFailure(error, 'businessGalleryOrderSaveError'));
    },
    onUploaded: () => {
      showToast(text('businessGalleryImageUploaded'));
    },
    onUploadError: (error) => {
      showErrorToast(describeFailure(error, 'businessGalleryImageUploadError'));
    },
    onPickError: () => {
      showErrorToast(text('businessGalleryImagePickError'));
    },
    onDeleted: () => {
      showToast(text('businessGallerySlideDeleted'));
    },
    onDeleteError: (error) => {
      showErrorToast(describeFailure(error, 'businessGallerySlideDeleteError'));
    },
  });

  const onDropAt = (index: number) => {
    if (dragId) gallery.moveToIndex(dragId, index);
    setDragId(null);
    setOverIndex(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-heading text-foreground">{text('businessHomeGalleryHeading')}</h2>
          <p className="text-body text-muted-foreground">{text('businessHomeGallerySubtitle')}</p>
          <p className="mt-1 text-caption text-muted-foreground">
            <FormattedMessage id="businessGallerySlideCount" values={{ count: slides.length }} />
          </p>
          <p className="mt-1 text-caption text-muted-foreground">{text('businessGalleryFormatsHint')}</p>
        </div>
        <Button type="button" icon="add" loading={gallery.isCreating} onClick={gallery.create}>
          {text('businessGalleryNewSlide')}
        </Button>
      </div>

      {slides.length === 0 ? (
        <EmptyState
          icon="photo_library_outlined"
          title={text('businessGalleryEmptyTitle')}
          message={text('businessGalleryEmptySubtitle')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {slides.map((slide, index) => (
            <GallerySlideCard
              key={slide.id}
              slide={slide}
              index={index}
              total={slides.length}
              gallery={gallery}
              dragging={dragId === slide.id}
              dropTarget={overIndex === index && dragId !== null && dragId !== slide.id}
              onDragStart={() => {
                setDragId(slide.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverIndex(null);
              }}
              onDragOver={() => {
                if (dragId && dragId !== slide.id) setOverIndex(index);
              }}
              onDrop={() => {
                onDropAt(index);
              }}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={gallery.deletingId !== null}
        onOpenChange={(open) => {
          if (!open) gallery.cancelDelete();
        }}
        title={text('businessGalleryDeleteDialogTitle')}
        message={text('businessGalleryDeleteDialogBody')}
        cancelLabel={text('adminCommonCancel')}
        confirmLabel={text('adminCommonDelete')}
        onConfirm={gallery.confirmDelete}
      />
    </div>
  );
}

function GallerySlideCard({
  slide,
  index,
  total,
  gallery,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  slide: GallerySlide;
  index: number;
  total: number;
  gallery: ReturnType<typeof useGallery>;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  const intl = useIntl();
  const text = textOf(intl);
  const inputRef = useRef<HTMLInputElement>(null);
  const alts = gallery.altsOf(slide);
  const hasImage = slide.previewUrl.trim().length > 0;

  const allowDrop = (event: DragEvent) => {
    event.preventDefault();
    onDragOver();
  };

  return (
    // HTML5 drop target for reorder; drag starts from the handle button above.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- drop zone
    <article
      className={cn(
        'rounded-lg border bg-card p-4',
        dropTarget ? 'border-border ring-2 ring-border/40' : 'border-border',
        dragging && 'opacity-60',
      )}
      onDragOver={allowDrop}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            draggable={!gallery.isReordering}
            aria-label={text('businessGalleryDragHandle')}
            title={text('businessGalleryDragHandle')}
            className="mt-0.5 cursor-grab rounded-sm p-1 text-muted-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--card))] active:cursor-grabbing"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', slide.id);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
          >
            <Icon name="drag_indicator" size={20} />
          </button>
          <div>
            <h3 className="text-body-strong text-foreground">
              <FormattedMessage id="businessGallerySlideLabelOf" values={{ index: index + 1, total }} />
            </h3>
            <StatusPill
              className="mt-1"
              tone={slide.isActive ? 'success' : 'neutral'}
              label={
                slide.isActive ? text('businessGalleryStatusActive') : text('businessGalleryStatusInactive')
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            icon="keyboard_arrow_up_rounded"
            disabled={index === 0 || gallery.isReordering}
            onClick={() => {
              gallery.move(slide, 'up');
            }}
          >
            {text('businessGalleryMoveUp')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon="keyboard_arrow_down_rounded"
            disabled={index === total - 1 || gallery.isReordering}
            onClick={() => {
              gallery.move(slide, 'down');
            }}
          >
            {text('businessGalleryMoveDown')}
          </Button>
          <Button
            type="button"
            variant="dangerTonal"
            icon="delete_outline"
            onClick={() => {
              gallery.askDelete(slide.id);
            }}
          >
            {text('adminCommonDelete')}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
            {hasImage ? (
              <img src={slide.previewUrl} alt={alts.es ?? ''} className="size-full object-cover" />
            ) : (
              <span className="text-body text-muted-foreground">{text('businessGalleryNoImage')}</span>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => {
              gallery.pickImage(slide, event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            loading={gallery.isUploading(slide.id)}
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            {gallery.isUploading(slide.id)
              ? text('businessGalleryUploadingImage')
              : hasImage
                ? text('businessGalleryChangeImage')
                : text('businessGalleryUploadImage')}
          </Button>
          {!hasImage && (
            <p className="text-caption text-muted-foreground">{text('businessGalleryNoImageUploaded')}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body text-muted-foreground">
              {slide.isActive ? text('businessGalleryStatusActive') : text('businessGalleryStatusInactive')}
            </span>
            <Switch
              checked={slide.isActive}
              disabled={gallery.isSavingStatus(slide.id)}
              onCheckedChange={(checked) => {
                gallery.setActive(slide, checked);
              }}
              aria-label={intl.formatMessage({ id: 'businessGallerySlideLabel' }, { index: index + 1 })}
            />
          </div>

          <div>
            <p className="mb-2 text-body-strong text-foreground">{text('legalVisibilityHeading')}</p>
            <SurfacesChips
              value={slide.publicSurfaces}
              disabled={gallery.isSavingSurfaces(slide.id)}
              onChange={(surface, enabled) => {
                gallery.setSurface(slide, surface, enabled);
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            {BUSINESS_LOCALES.map((locale) => (
              <FormField
                key={locale}
                id={`gallery-alt-${slide.id}-${locale}`}
                label={intl.formatMessage(
                  { id: 'businessGalleryAltTextLabel' },
                  { locale: text(BUSINESS_LOCALE_LABEL[locale]) },
                )}
              >
                <Textarea
                  id={`gallery-alt-${slide.id}-${locale}`}
                  rows={2}
                  placeholder={text('businessGalleryAltTextHint')}
                  value={alts[locale] ?? ''}
                  onChange={(event) => {
                    gallery.setAlt(slide.id, locale, event.target.value);
                  }}
                />
              </FormField>
            ))}
            <div>
              <Button
                type="button"
                loading={gallery.isSavingAlts(slide.id)}
                onClick={() => {
                  gallery.saveAlts(slide);
                }}
              >
                {gallery.isSavingAlts(slide.id)
                  ? text('businessGallerySaving')
                  : text('businessGallerySaveAltTexts')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
