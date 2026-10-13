import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Spinner } from '../primitives/spinner';
import { InlineAction, type ActionTone } from './data-display';

type AvatarProps = {
  /** A presigned image URL from the API; without one, the person icon. */
  src?: string | null;
  size: number;
  /** Names the button that opens the picture full screen. */
  viewLabel: string;
  className?: string;
};

/**
 * AdminAuthenticatedAvatar: a round picture on the muted surface, with a spinner while it loads and
 * the person icon when it is missing or fails. With a picture, a click opens it full screen.
 */
export function Avatar({ src, size, viewLabel, className }: AvatarProps) {
  const url = src?.trim() ?? '';
  const [state, setState] = useState<{ url: string; status: 'loading' | 'loaded' | 'failed' }>({
    url,
    status: 'loading',
  });
  const [viewing, setViewing] = useState(false);
  // A new picture starts loading again.
  const status = state.url === url ? state.status : 'loading';
  if (state.url !== url) setState({ url, status: 'loading' });

  const placeholder = <Icon name="person_outline_rounded" size={size * 0.55} />;
  const box = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-card text-muted-foreground',
    className,
  );
  const style = { width: size, height: size };

  if (!url) {
    return (
      <span aria-hidden className={box} style={style}>
        {placeholder}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={viewLabel}
        onClick={(event) => {
          event.stopPropagation();
          setViewing(true);
        }}
        // Clickable inside a row or card that opens on click.
        className={cn(box, 'pointer-events-auto relative z-10 cursor-pointer')}
        style={style}
      >
        {status === 'failed' ? (
          placeholder
        ) : (
          <img
            src={url}
            alt=""
            onLoad={() => {
              setState({ url, status: 'loaded' });
            }}
            onError={() => {
              setState({ url, status: 'failed' });
            }}
            className={cn('size-full object-cover', status === 'loading' && 'opacity-0')}
          />
        )}
        {status === 'loading' && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size={size * 0.45} className="text-primary" />
          </span>
        )}
      </button>
      <Dialog open={viewing} onOpenChange={setViewing}>
        {/* showAdminAvatarFullscreenFromUrl: the picture on a black87 barrier; a click closes it. */}
        <DialogContent
          aria-describedby={undefined}
          onClick={() => {
            setViewing(false);
          }}
          className="top-0 left-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center rounded-none bg-transparent p-0"
          overlayClassName="bg-black/87"
        >
          <DialogTitle className="sr-only">{viewLabel}</DialogTitle>
          <img src={url} alt="" className="max-h-dvh max-w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}

type EntityCardProps = {
  title: string;
  /** Under the title, such as the client's email on a slot-watch card. */
  subtitle?: string;
  /** Before the title, such as an avatar. */
  leading?: ReactNode;
  /** After the title, such as the status pill. */
  status: ReactNode;
  /** Under the label rows, such as the upgrade note on a slot-watch card. */
  note?: ReactNode;
  /** Label and value rows under the title. */
  meta: readonly (readonly [label: string, value: string])[];
  /** Width of the label column: 96px (AdminUserEntityCard) or 72px (AdminAppointmentCard). */
  labelWidth?: 96 | 72;
  /** Values cut at two lines with an ellipsis (AdminAppointmentCard) instead of wrapping. */
  clampValues?: boolean;
  /** Opens the entity: the whole card, with this name for assistive technology. */
  onOpen: () => void;
  /** Inline actions under the rows. */
  actions: readonly {
    icon: Parameters<typeof InlineAction>[0]['icon'];
    label: string;
    onClick: () => void;
    tone?: ActionTone;
  }[];
};

/**
 * The card of a list row on compact layouts (AdminServiceCard, AdminUserEntityCard): title and
 * status, then the label rows, then the inline actions. The whole card opens the entity.
 */
export function EntityCard({
  title,
  subtitle,
  leading,
  status,
  note,
  meta,
  labelWidth = 96,
  clampValues = false,
  onOpen,
  actions,
}: EntityCardProps) {
  return (
    <article className="relative rounded-lg border border-border bg-card p-4 hover:bg-muted">
      <button
        type="button"
        aria-label={title}
        onClick={onOpen}
        className="absolute inset-0 cursor-pointer rounded-lg"
      />
      <div className="pointer-events-none relative">
        <div className="flex items-center gap-3">
          {leading}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-heading text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-muted-foreground">{subtitle}</p>}
          </div>
          {status}
        </div>
        <dl className="mt-3.5 flex flex-col gap-2">
          {meta.map(([label, value]) => (
            <div key={label} className="flex items-start">
              <dt
                className={cn(
                  'shrink-0 text-label text-muted-foreground',
                  labelWidth === 96 ? 'w-24' : 'w-[72px]',
                )}
              >
                {label}
              </dt>
              {/* A word longer than the row breaks anywhere, as Flutter wraps it. */}
              <dd
                className={cn(
                  'min-w-0 flex-1 text-body [overflow-wrap:anywhere] text-foreground',
                  clampValues && 'line-clamp-2',
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {note}
      </div>
      <div className="relative z-10 mt-3.5 flex flex-wrap gap-1">
        {actions.map((action) => (
          <InlineAction
            key={action.label}
            compact
            icon={action.icon}
            label={action.label}
            tone={action.tone}
            onClick={action.onClick}
          />
        ))}
      </div>
    </article>
  );
}
