import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  showErrorToast,
  showToast,
  StatusPill,
  Switch,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useLegal } from '../../hooks/use-legal';
import { legalDocLabelId, type LegalDocument } from '../../model/legal-document';
import { LocaleSegmented } from '../shared/locale-segmented';
import { MarkdownEditor } from '../shared/markdown-editor';
import { SurfacesChips } from '../shared/surfaces-chips';
import { textOf } from '../shared/labels';

const WIDE_MIN = 880;

type LegalTabProps = {
  documents: LegalDocument[];
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
};

/** Legal documents CMS: master-detail from 880px, expansion list below. */
export function LegalTab({ documents, selectedCode, onSelectCode }: LegalTabProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const [ref, width] = useElementWidth();
  const legal = useLegal(
    documents,
    {
      onStatusSaved: () => {
        showToast(text('businessLegalDocumentStatusSaved'));
      },
      onStatusError: (error) => {
        showErrorToast(describeFailure(error, 'businessLegalDocumentStatusSaveError'));
      },
      onSurfacesSaved: () => {
        showToast(text('legalPublicSurfacesUpdated'));
      },
      onSurfacesError: (error) => {
        showErrorToast(describeFailure(error, 'legalPublicSurfacesError'));
      },
      onTranslationSaved: () => {
        showToast(text('businessLegalTranslationSaved'));
      },
      onTranslationError: (error) => {
        showErrorToast(describeFailure(error, 'businessLegalTranslationSaveError'));
      },
    },
    { codeFromUrl: selectedCode, onCodeChange: onSelectCode },
  );

  if (documents.length === 0) {
    return (
      <EmptyState
        icon="article_outlined"
        title={text('legalEmptyTitle')}
        message={text('legalEmptySubtitle')}
      />
    );
  }

  const wide = (width ?? 0) >= WIDE_MIN;
  const docLabel = (doc: LegalDocument) => text(legalDocLabelId(doc.code) as MessageId);

  return (
    <div ref={ref} className="min-w-0">
      <UnsavedChangesGuard
        when={legal.hasUnsavedChanges}
        labels={{
          title: text('legalUnsavedChangesTitle'),
          message: text('legalUnsavedChangesBody'),
          keepEditing: text('legalKeepEditing'),
          discard: text('legalDiscard'),
        }}
      />
      <ConfirmDialog
        open={legal.discardOpen}
        onOpenChange={(open) => {
          if (!open) legal.keepEditing();
        }}
        title={text('legalUnsavedChangesTitle')}
        message={text('legalUnsavedChangesBody')}
        cancelLabel={text('legalKeepEditing')}
        confirmLabel={text('legalDiscard')}
        onConfirm={legal.discard}
      />

      {wide ? (
        <div className="flex gap-3">
          <div className="flex w-[280px] shrink-0 flex-col gap-2">
            {legal.documents.map((doc) => (
              <button
                key={doc.code}
                type="button"
                onClick={() => {
                  legal.selectDocument(doc.code);
                }}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left',
                  doc.code === legal.selected?.code
                    ? 'border-border bg-selection-wash'
                    : 'border-border hover:bg-[color-mix(in_srgb,var(--foreground)_4%,var(--card))]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-strong text-foreground">{docLabel(doc)}</span>
                  <StatusPill
                    tone={doc.isActive ? 'success' : 'neutral'}
                    label={doc.isActive ? text('legalStatusActive') : text('legalStatusInactive')}
                  />
                </div>
              </button>
            ))}
          </div>
          <div className="w-px shrink-0 bg-border" />
          <div className="min-w-0 flex-1">
            {legal.selected ? (
              <LegalEditor legal={legal} docLabel={docLabel(legal.selected)} />
            ) : (
              <p className="text-body text-muted-foreground">{text('legalSelectDocument')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {legal.documents.map((doc, index) => {
            const open = doc.code === legal.selected?.code || (legal.selected === null && index === 0);
            return (
              <details
                key={doc.code}
                open={open}
                className="rounded-lg border border-border"
                onToggle={(event) => {
                  if ((event.target as HTMLDetailsElement).open) legal.selectDocument(doc.code);
                }}
              >
                <summary className="cursor-pointer list-none px-4 py-3 text-body-strong text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>{docLabel(doc)}</span>
                    <StatusPill
                      tone={doc.isActive ? 'success' : 'neutral'}
                      label={doc.isActive ? text('legalStatusActive') : text('legalStatusInactive')}
                    />
                  </div>
                </summary>
                <div className="border-t border-border px-4 py-4">
                  {legal.selected?.code === doc.code ? (
                    <LegalEditor legal={legal} docLabel={docLabel(doc)} />
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LegalEditor({ legal, docLabel }: { legal: ReturnType<typeof useLegal>; docLabel: string }) {
  const intl = useIntl();
  const text = textOf(intl);
  const doc = legal.selected;
  if (!doc) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-heading text-foreground">{docLabel}</h3>
        <div className="flex items-center gap-3">
          <span className="text-body text-muted-foreground">
            {doc.isActive ? text('legalStatusActive') : text('legalStatusInactive')}
          </span>
          <Switch
            checked={doc.isActive}
            disabled={legal.isSavingStatus(doc.code)}
            onCheckedChange={(checked) => {
              legal.setActive(doc, checked);
            }}
            aria-label={docLabel}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-body-strong text-foreground">{text('legalVisibilityHeading')}</p>
        <SurfacesChips
          value={doc.publicSurfaces}
          disabled={legal.isSavingSurfaces(doc.code)}
          onChange={(surface, enabled) => {
            legal.setSurface(doc, surface, enabled);
          }}
        />
      </div>

      <LocaleSegmented value={legal.locale} onValueChange={legal.setLocale} />

      <FormField id="legal-title" label={text('legalFieldTitle')}>
        <Input
          id="legal-title"
          value={legal.title}
          onChange={(event) => {
            legal.setTitle(event.target.value);
          }}
        />
      </FormField>

      <FormField id="legal-content" label={text('legalFieldContentMarkdown')}>
        <MarkdownEditor id="legal-content" value={legal.content} onChange={legal.setContent} />
      </FormField>

      <div>
        <Button
          type="button"
          loading={legal.isSavingTranslation}
          disabled={!legal.isDirty}
          onClick={legal.saveTranslation}
        >
          {text('legalSaveTranslation')}
        </Button>
      </div>
    </div>
  );
}
