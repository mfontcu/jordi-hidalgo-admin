import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { listLayoutFor, summaryColumnsFor, type ListLayout } from './list-layout';
import { useElementWidth } from './use-element-width';

const ListLayoutContext = createContext<ListLayout>(listLayoutFor(1440));

/** Layout of the list page around (AdminListPageLayoutSpec), by its content width. */
export function useListLayout(): ListLayout {
  return useContext(ListLayoutContext);
}

type ListPageProps = {
  title: string;
  subtitle: string;
  /** Between the header and the summary (`beforeSummary`), such as the blocked-slots tabs. */
  beforeSummary?: ReactNode;
  /** Summary cards; folded into a disclosure on compact layouts. */
  summary?: ReactNode;
  /** Title of the folded summary. */
  summaryLabel: string;
  toolbar: ReactNode;
  children: ReactNode;
};

/**
 * Scrollable layout of a CRUD list (AdminListPageScaffold): header, summary, toolbar, and body.
 * Under 700px the mobile header already shows the title, so the page leaves it out. Children read
 * the layout with `useListLayout`.
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
            <div className="mb-(--section-gap) max-[699px]:sr-only">
              <h1 className="font-black text-on-surface" style={{ fontSize: layout.titleSize }}>
                {title}
              </h1>
              <p className="mt-2 leading-[1.5] text-content-secondary">{subtitle}</p>
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

/** AdminCollapsibleSummarySection: starts folded, to save room on compact layouts. */
export function CollapsibleSummary({ label, children }: { label: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded((value) => !value);
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left hover:bg-on-surface/4"
      >
        <Icon name="insights_outlined" size={22} className="text-content-secondary" />
        <span className="flex-1 text-[15px] font-extrabold text-on-surface">{label}</span>
        <Icon
          name="expand_more_rounded"
          className={cn('text-content-secondary transition-transform duration-200', expanded && 'rotate-180')}
        />
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/** AdminSummaryStatGrid: equal cards of the layout's height, 16px apart. */
export function SummaryGrid({ children, count }: { children: ReactNode; count: number }) {
  const layout = useListLayout();
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${summaryColumnsFor(layout, count)}, minmax(0, 1fr))`,
        gridAutoRows: layout.summaryCardHeight,
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
  /** A value size of its own (`valueFontSize`), such as 24px for a date; the layout's otherwise. */
  valueSize?: number;
};

/** AdminStatCard: title, a large value, and a two-line subtitle, centered. */
export function StatCard({ title, value, subtitle, valueSize }: StatCardProps) {
  const layout = useListLayout();
  return (
    <div className="flex h-full flex-col justify-center rounded-lg border border-border bg-surface px-4 py-3.5 text-center">
      <p className="truncate font-bold text-content-secondary">{title}</p>
      <p
        className="mt-3.5 truncate leading-none font-black text-on-surface"
        style={{ fontSize: valueSize ?? layout.summaryValueSize }}
      >
        {value}
      </p>
      <p className="mt-3 line-clamp-2 leading-[1.35] text-content-secondary">{subtitle}</p>
    </div>
  );
}
