import {
  cancellationOf,
  isFinalStatus,
  messagePreviewOf,
  rowActionsOf,
  statusChangeOf,
  statusLabelOf,
  statusToneOf,
} from './appointment';

const now = Date.parse('2026-10-12T09:00:00Z');

describe('appointments in lists', () => {
  it('treats completed, cancelled, no-show, and rescheduled as final', () => {
    for (const status of ['completed', 'cancelled', 'no_show', 'Rescheduled'])
      expect(isFinalStatus(status)).toBe(true);
    for (const status of ['pending', 'confirmed', 'booked']) expect(isFinalStatus(status)).toBe(false);
  });

  it('cancels an open appointment, and completes it or marks a no-show once it has started', () => {
    expect(rowActionsOf({ status: 'confirmed', start: '2026-10-12T10:00:00Z' }, now)).toEqual({
      cancel: true,
      completeOrNoShow: false,
    });
    expect(rowActionsOf({ status: 'pending', start: '2026-10-12T09:00:00Z' }, now)).toEqual({
      cancel: true,
      completeOrNoShow: true,
    });
    expect(rowActionsOf({ status: 'completed', start: '2026-10-11T09:00:00Z' }, now)).toEqual({
      cancel: false,
      completeOrNoShow: false,
    });
  });

  it('labels and colors each status, and shows an unknown one as it comes', () => {
    expect(statusLabelOf(' No_Show ')).toBe('appointmentStatusNoShow');
    expect(statusLabelOf('booked')).toBeNull();
    expect(statusToneOf('pending')).toBe('warning');
    expect(statusToneOf('confirmed')).toBe('info');
    expect(statusToneOf('completed')).toBe('success');
    expect(statusToneOf('cancelled')).toBe('danger');
    expect(statusToneOf('no_show')).toBe('neutralStrong');
    expect(statusToneOf('rescheduled')).toBe('muted');
  });

  it('keeps the stored internal notes when the status changes', () => {
    expect(statusChangeOf({ internalNotes: 'Pagó por Bizum' }, 'completed')).toEqual({
      status: 'completed',
      internalNotes: 'Pagó por Bizum',
      cancellationReason: '',
    });
    expect(cancellationOf({ internalNotes: 'Llamar antes' })).toEqual({
      internalNotes: 'Llamar antes',
      cancellationReason: '',
    });
  });

  it('collapses the client message to one line, and shows a dash without one', () => {
    expect(messagePreviewOf('  Hola,\n\n  llego   tarde ')).toBe('Hola, llego tarde');
    expect(messagePreviewOf(' \n ')).toBe('—');
  });
});
