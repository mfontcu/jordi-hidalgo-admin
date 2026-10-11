import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setViewport } from '@/test/match-media';
import { renderWithProviders } from '@/test/render';

import { DateRangeDialog, selectDay, type DayRange } from './date-pickers';
import { Avatar } from './entity';

const labels = {
  title: 'Choose range',
  start: 'Start',
  end: 'End',
  notSelected: 'Not selected',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  thisMonth: 'This month',
  clear: 'Remove range',
  cancel: 'Cancel',
  apply: 'Apply range',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
};

const base = { start: null, end: null, completed: false, active: null, month: '2026-10-01' } as const;

describe('range selection (_onDaySelected)', () => {
  it('picks the start, then an end on or after it', () => {
    const started = selectDay(base, '2026-10-05');
    expect(started).toMatchObject({ start: '2026-10-05', end: null, completed: false, active: 'end' });
    expect(selectDay(started, '2026-10-09')).toMatchObject({
      start: '2026-10-05',
      end: '2026-10-09',
      completed: true,
      active: null,
    });
    // A day before the start starts over from it.
    expect(selectDay(started, '2026-10-01')).toMatchObject({ start: '2026-10-01', end: null, active: 'end' });
  });

  it('starts over after a completed range, and follows the active endpoint', () => {
    const done = { ...base, start: '2026-10-05', end: '2026-10-09', completed: true };
    expect(selectDay(done, '2026-10-20')).toMatchObject({ start: '2026-10-20', end: null, completed: false });
    expect(selectDay({ ...done, active: 'start' }, '2026-10-02')).toMatchObject({
      start: '2026-10-02',
      end: null,
      active: 'end',
    });
    expect(selectDay({ ...done, end: null, completed: false, active: 'end' }, '2026-10-07')).toMatchObject({
      end: '2026-10-07',
      completed: true,
    });
  });
});

function renderDialog(initial: DayRange | null, onApply: (range: DayRange) => void = () => undefined) {
  return renderWithProviders(
    <DateRangeDialog
      open
      onOpenChange={() => undefined}
      initial={initial}
      today="2026-10-11"
      language="en"
      labels={labels}
      formatDay={(day) => day}
      onApply={onApply}
    />,
  );
}

describe('DateRangeDialog', () => {
  it('opens on the range, shows two months, and applies a quick range', async () => {
    const applied: DayRange[] = [];
    renderDialog({ from: '2026-10-01', to: '2026-10-05' }, (range) => {
      applied.push(range);
    });
    const user = userEvent.setup();
    const dialog = screen.getByRole('dialog', { name: 'Choose range' });

    expect(within(dialog).getByRole('button', { name: /Start/ })).toHaveTextContent('2026-10-01');
    expect(within(dialog).getByText('October 2026 – November 2026')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Last 7 days' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply range' }));
    expect(applied).toEqual([{ from: '2026-10-05', to: '2026-10-11' }]);
  });

  it('cannot apply after clearing until both ends are chosen', async () => {
    renderDialog(null);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Remove range' }));
    expect(screen.getByRole('button', { name: 'Apply range' })).toBeDisabled();
    expect(screen.getAllByText('Not selected')).toHaveLength(2);
  });

  it('shows one month in a sheet on a narrow window', () => {
    setViewport({ width: 390 });
    renderDialog(null);
    // The calendar keeps its own hidden caption beside the title.
    expect(screen.getAllByText('October 2026').length).toBeGreaterThan(0);
    expect(screen.queryByText(/November 2026/)).not.toBeInTheDocument();
  });
});

describe('Avatar', () => {
  it('shows the person icon without a picture, and opens a picture full screen', async () => {
    const { rerender } = renderWithProviders(<Avatar size={40} viewLabel="View photo" />);
    expect(screen.queryByRole('button', { name: 'View photo' })).not.toBeInTheDocument();

    rerender(<Avatar src="https://example.com/a.jpg" size={40} viewLabel="View photo" />);
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'View photo' });
    const image = button.querySelector('img');
    if (image) fireEvent.load(image);
    await user.click(button);
    expect(await screen.findByRole('dialog', { name: 'View photo' })).toBeInTheDocument();
  });
});
