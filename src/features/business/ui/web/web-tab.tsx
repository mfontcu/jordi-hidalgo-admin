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

import { useWebPages } from '../../hooks/use-web-pages';
import { webPageLabelId, type WebPage } from '../../model/web-page';
import { LocaleSegmented } from '../shared/locale-segmented';
import { MarkdownEditor } from '../shared/markdown-editor';
import { textOf } from '../shared/labels';

const WIDE_MIN = 880;

type WebTabProps = {
  pages: WebPage[];
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
};

/** Web pages CMS (support, …): master-detail without public surfaces. */
export function WebTab({ pages, selectedCode, onSelectCode }: WebTabProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const [ref, width] = useElementWidth();
  const web = useWebPages(
    pages,
    {
      onStatusSaved: () => {
        showToast(text('businessWebPageSaved'));
      },
      onStatusError: (error) => {
        showErrorToast(describeFailure(error, 'businessWebPageSaveError'));
      },
      onTranslationSaved: () => {
        showToast(text('businessWebTranslationSaved'));
      },
      onTranslationError: (error) => {
        showErrorToast(describeFailure(error, 'businessWebTranslationSaveError'));
      },
    },
    { codeFromUrl: selectedCode, onCodeChange: onSelectCode },
  );

  if (pages.length === 0) {
    return (
      <EmptyState
        icon="language"
        title={text('businessWebPagesEmpty')}
        message={text('businessWebPagesSubtitle')}
      />
    );
  }

  const wide = (width ?? 0) >= WIDE_MIN;
  const pageLabel = (page: WebPage) => text(webPageLabelId(page.code) as MessageId);

  return (
    <div ref={ref} className="min-w-0">
      <div className="mb-4">
        <h2 className="text-heading text-foreground">{text('businessWebPagesHeading')}</h2>
        <p className="text-body text-muted-foreground">{text('businessWebPagesSubtitle')}</p>
      </div>

      <UnsavedChangesGuard
        when={web.hasUnsavedChanges}
        labels={{
          title: text('legalUnsavedChangesTitle'),
          message: text('legalUnsavedChangesBody'),
          keepEditing: text('legalKeepEditing'),
          discard: text('legalDiscard'),
        }}
      />
      <ConfirmDialog
        open={web.discardOpen}
        onOpenChange={(open) => {
          if (!open) web.keepEditing();
        }}
        title={text('legalUnsavedChangesTitle')}
        message={text('legalUnsavedChangesBody')}
        cancelLabel={text('legalKeepEditing')}
        confirmLabel={text('legalDiscard')}
        onConfirm={web.discard}
      />

      {wide ? (
        <div className="flex gap-3">
          <div className="flex w-[280px] shrink-0 flex-col gap-2">
            {web.pages.map((page) => (
              <button
                key={page.code}
                type="button"
                onClick={() => {
                  web.selectPage(page.code);
                }}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left',
                  page.code === web.selected?.code
                    ? 'border-border bg-selection-wash'
                    : 'border-border hover:bg-[color-mix(in_srgb,var(--foreground)_4%,var(--card))]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-strong text-foreground">{pageLabel(page)}</span>
                  <StatusPill
                    tone={page.isActive ? 'success' : 'neutral'}
                    label={page.isActive ? text('legalStatusActive') : text('legalStatusInactive')}
                  />
                </div>
              </button>
            ))}
          </div>
          <div className="w-px shrink-0 bg-border" />
          <div className="min-w-0 flex-1">
            {web.selected ? <WebEditor web={web} pageLabel={pageLabel(web.selected)} /> : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {web.pages.map((page, index) => {
            const open = page.code === web.selected?.code || (web.selected === null && index === 0);
            return (
              <details
                key={page.code}
                open={open}
                className="rounded-lg border border-border"
                onToggle={(event) => {
                  if ((event.target as HTMLDetailsElement).open) web.selectPage(page.code);
                }}
              >
                <summary className="cursor-pointer list-none px-4 py-3 text-body-strong text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>{pageLabel(page)}</span>
                    <StatusPill
                      tone={page.isActive ? 'success' : 'neutral'}
                      label={page.isActive ? text('legalStatusActive') : text('legalStatusInactive')}
                    />
                  </div>
                </summary>
                <div className="border-t border-border px-4 py-4">
                  {web.selected?.code === page.code ? (
                    <WebEditor web={web} pageLabel={pageLabel(page)} />
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

function WebEditor({ web, pageLabel }: { web: ReturnType<typeof useWebPages>; pageLabel: string }) {
  const intl = useIntl();
  const text = textOf(intl);
  const page = web.selected;
  if (!page) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-heading text-foreground">{pageLabel}</h3>
        <div className="flex items-center gap-3">
          <span className="text-body text-muted-foreground">
            {page.isActive ? text('legalStatusActive') : text('legalStatusInactive')}
          </span>
          <Switch
            checked={page.isActive}
            disabled={web.isSavingStatus(page.code)}
            onCheckedChange={(checked) => {
              web.setActive(page, checked);
            }}
            aria-label={pageLabel}
          />
        </div>
      </div>

      <LocaleSegmented value={web.locale} onValueChange={web.setLocale} />

      <FormField id="web-title" label={text('legalFieldTitle')}>
        <Input
          id="web-title"
          value={web.title}
          onChange={(event) => {
            web.setTitle(event.target.value);
          }}
        />
      </FormField>

      <FormField id="web-content" label={text('legalFieldContentMarkdown')}>
        <MarkdownEditor id="web-content" value={web.content} onChange={web.setContent} />
      </FormField>

      <div>
        <Button
          type="button"
          loading={web.isSavingTranslation}
          disabled={!web.isDirty}
          onClick={web.saveTranslation}
        >
          {text('legalSaveTranslation')}
        </Button>
      </div>
    </div>
  );
}
