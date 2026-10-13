import { lazy, Suspense, useId, useState } from 'react';
import { useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Button, Icon, Spinner, Textarea } from '@/shared/ui';

import { textOf } from './labels';

const MarkdownPreview = lazy(async () => {
  const [{ default: ReactMarkdown }, remarkGfm, rehypeSanitize] = await Promise.all([
    import('react-markdown'),
    import('remark-gfm'),
    import('rehype-sanitize'),
  ]);
  return {
    default: function Preview({ source }: { source: string }) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm.default]} rehypePlugins={[rehypeSanitize.default]}>
          {source}
        </ReactMarkdown>
      );
    },
  };
});

const EDIT_PANE_HEIGHT = 320;
const PREVIEW_MAX_HEIGHT = 280;

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  id?: string;
};

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
): { next: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end);
  const next = `${value.slice(0, start)}${before}${selected || ''}${after}${value.slice(end)}`;
  if (!selected) {
    const cursor = start + before.length;
    return { next, selectionStart: cursor, selectionEnd: cursor };
  }
  return {
    next,
    selectionStart: start,
    selectionEnd: start + before.length + selected.length + after.length,
  };
}

function prefixLines(value: string, start: number, end: number, prefix: string) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const index = value.indexOf('\n', end);
  const lineEnd = index === -1 ? value.length : index;
  const block = value.slice(lineStart, lineEnd);
  const nextBlock = block
    .split('\n')
    .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
    .join('\n');
  return {
    next: `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + nextBlock.length,
  };
}

/** Preview-first Markdown editor matching Flutter `LegalMarkdownEditor`. */
export function MarkdownEditor({ value, onChange, readOnly = false, id }: MarkdownEditorProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const [editing, setEditing] = useState(false);
  const generatedId = useId();
  const textareaId = id ?? `${generatedId}-textarea`;

  if (readOnly) {
    return (
      <PreviewPane
        source={value}
        emptyLabel={text('businessMarkdownEditorEmptyPreview')}
        maxHeight={PREVIEW_MAX_HEIGHT}
      />
    );
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <Button
            type="button"
            variant="text"
            icon="edit_outlined"
            onClick={() => {
              setEditing(true);
            }}
          >
            {text('businessMarkdownEditorEditContent')}
          </Button>
        </div>
        <PreviewPane
          source={value}
          emptyLabel={text('businessMarkdownEditorEmptyPreview')}
          maxHeight={PREVIEW_MAX_HEIGHT}
        />
      </div>
    );
  }

  const apply = (
    transform: (
      value: string,
      start: number,
      end: number,
    ) => {
      next: string;
      selectionStart: number;
      selectionEnd: number;
    },
  ) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const result = transform(value, start, end);
    onChange(result.next);
    requestAnimationFrame(() => {
      const next = document.getElementById(textareaId) as HTMLTextAreaElement | null;
      next?.focus();
      next?.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const editor = (
    <div
      className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card"
      style={{ height: EDIT_PANE_HEIGHT }}
    >
      <div className="flex shrink-0 gap-1 border-b border-border px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          icon="format_bold"
          onClick={() => {
            apply((v, s, e) => wrapSelection(v, s, e, '**', '**'));
          }}
        />
        <ToolbarButton
          label="Italic"
          icon="format_italic"
          onClick={() => {
            apply((v, s, e) => wrapSelection(v, s, e, '*', '*'));
          }}
        />
        <ToolbarButton
          label="List"
          icon="format_list_bulleted"
          onClick={() => {
            apply((v, s, e) => prefixLines(v, s, e, '- '));
          }}
        />
        <ToolbarButton
          label="Link"
          icon="link"
          onClick={() => {
            apply((v, s, e) => {
              const selected = v.slice(s, e) || 'text';
              const before = '[';
              const after = '](https://)';
              const next = `${v.slice(0, s)}${before}${selected}${after}${v.slice(e)}`;
              return {
                next,
                selectionStart: s + before.length,
                selectionEnd: s + before.length + selected.length,
              };
            });
          }}
        />
      </div>
      <Textarea
        id={textareaId}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={text('businessMarkdownEditorHint')}
        className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          type="button"
          variant="text"
          onClick={() => {
            setEditing(false);
          }}
        >
          {text('businessMarkdownEditorPreview')}
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">{text('businessMarkdownEditorLivePreviewHint')}</p>
      <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2">
        {editor}
        <PreviewPane source={value} emptyLabel={text('businessMarkdownEditorEmptyPreview')} fill />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: 'format_bold' | 'format_italic' | 'format_list_bulleted' | 'link';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

function PreviewPane({
  source,
  emptyLabel,
  maxHeight,
  fill = false,
}: {
  source: string;
  emptyLabel: string;
  maxHeight?: number;
  fill?: boolean;
}) {
  const trimmed = source.trim();
  return (
    <div
      className={cn('overflow-auto rounded-lg border border-border bg-card p-4', fill && 'min-h-0')}
      style={{
        height: fill ? EDIT_PANE_HEIGHT : undefined,
        maxHeight: fill ? undefined : maxHeight,
      }}
    >
      {trimmed === '' ? (
        <p className="text-body text-muted-foreground italic">{emptyLabel}</p>
      ) : (
        <Suspense
          fallback={
            <div className="flex justify-center py-6">
              <Spinner size={24} className="text-primary" />
            </div>
          }
        >
          <div className="text-body text-foreground [&_a]:text-primary [&_h1]:mb-3 [&_h1]:text-title [&_h2]:mb-2 [&_h2]:text-heading [&_h3]:mb-2 [&_h3]:text-body-strong [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
            <MarkdownPreview source={source} />
          </div>
        </Suspense>
      )}
    </div>
  );
}
