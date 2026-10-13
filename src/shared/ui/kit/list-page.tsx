import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { listLayoutFor, summaryColumnsFor, type ListLayout } from './list-layout';
import { useElementWidth } from './use-element-width';

const ListLayoutContext = createContext<ListLayout>(listLayoutFor(1440));

/** Layout of the list page around it, by its content width. */
export function useListLayout(): ListLayout {
  return useContext(ListLayoutContext);
}

type ListPageProps = {
  title: string;
  subtitle: string;
  /** Between the header and the summary, such as the blocked-slots tabs. */
  beforeSummary?: ReactNode;
  /** Summary cards; folded into a disclosure on compact layouts. */
  summary?: ReactNode;
  /** Title of the folded summary. */
  summaryLabel: string;
  toolbar: ReactNode;
  children: ReactNode;
};

/**
 * Scrollable layout of a list: header, summary, toolbar, and body. Under 768px the mobile
 * header already shows the title, so the page leaves it out. Children read the layout with
 * `useListLayout`.
 */
export function ListPage({
  title,
  subtitle,
  beforeSummary,
  summary,
  summaryLabel,
  toolbar,
  children,
}: ListPageProps) {
  const [ref, width] = useElementWidth();
  const layout = listLayoutFor(width ?? 1440);
  const style = {
    padding: layout.pagePadding,
    '--section-gap': `${layout.sectionGap}px`,
    '--section-gap-lg': `${layout.sectionGapLarge}px`,
  } as CSSProperties;

  return (
    <ListLayoutContext value={layout}>
      <div ref={ref} className="min-w-0">
        {width !== null && (
          <div style={style} className="flex flex-col">
            {/* Not a landmark: the shell already owns the page banner. */}
            <div className="mb-(--section-gap) max-[767px]:sr-only">
              <h1 className="text-title text-foreground">{title}</h1>
              <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>
            </div>
            {beforeSummary && <div className="mb-(--section-gap)">{beforeSummary}</div>}
            {summary && (
              <div className="mb-(--section-gap)">
                {layout.compact ? (
                  <CollapsibleSummary label={summaryLabel}>{summary}</CollapsibleSummary>
                ) : (
                  summary
                )}
              </div>
            )}
            <div className="mb-(--section-gap-lg)">{toolbar}</div>
            {children}
          </div>
        )}
      </div>
    </ListLayoutContext>
  );
}

/** Folded summary for compact layouts. Starts closed. */
export function CollapsibleSummary({ label, children }: { label: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded((value) => !value);
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-muted"
      >
        <Icon name="insights_outlined" size={20} className="text-muted-foreground" />
        <span className="flex-1 text-body-strong text-foreground">{label}</span>
        <Icon
          name="expand_more_rounded"
          size={20}
          className={cn('text-muted-foreground transition-transform duration-150', expanded && 'rotate-180')}
        />
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/** Equal summary cards, 16px apart. */
export function SummaryGrid({ children, count }: { children: ReactNode; count: number }) {
  const layout = useListLayout();
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${summaryColumnsFor(layout, count)}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  /** Kept so current screens still type-check. The figure uses the heading step. */
  valueSize?: number;
};

/** Title, a heading-sized figure, and a two-line subtitle, centered. */
export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="flex h-full flex-col justify-center rounded-lg border border-border bg-card px-4 py-3 text-center">
      <p className="truncate text-label text-muted-foreground">{title}</p>
      <p className="mt-2 truncate text-heading text-foreground">{value}</p>
      <p className="mt-2 line-clamp-2 text-caption text-muted-foreground">{subtitle}</p>
    </div>
  );
}
