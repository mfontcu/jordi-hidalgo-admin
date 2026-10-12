import type { AdminUser } from './admin-user';
import {
  canBook,
  clientBlockInput,
  clientStatus,
  displayNameOf,
  hasOperationalAlerts,
  isNoShowRisk,
  usesApp,
} from './client';

const client: AdminUser = {
  id: 'cli-1',
  firstName: 'María',
  lastName: 'Pérez',
  phone: '+34600111222',
  email: '',
  avatarUrl: '',
  isActive: true,
  isBlocked: false,
  blockedReason: '',
  adminAlias: '',
  internalNotes: '',
  createdAt: '2026-01-10T10:00:00Z',
  lastAppointmentAt: null,
  nextAppointmentAt: null,
  blockedAt: null,
  frequentServices: [],
  noShowCountLast90Days: 0,
  rescheduleCountLast90Days: 0,
  totalAppointments: 0,
};

describe('clients (app_api AdminUser)', () => {
  it('shows the alias before the name in the app', () => {
    expect(displayNameOf(client)).toBe('María Pérez');
    expect(displayNameOf({ ...client, adminAlias: ' Mari (madre de Juan) ' })).toBe('Mari (madre de Juan)');
    expect(displayNameOf({ ...client, firstName: '', lastName: '' })).toBe('');
  });

  it('books only verified clients who are not blocked', () => {
    expect(canBook(client)).toBe(true);
    expect(canBook({ ...client, isActive: false })).toBe(false);
    expect(canBook({ ...client, isBlocked: true })).toBe(false);
  });

  it('marks a risk from two no-shows in 90 days, and alerts on it or on notes', () => {
    expect(isNoShowRisk({ noShowCountLast90Days: 1 })).toBe(false);
    expect(isNoShowRisk({ noShowCountLast90Days: 2 })).toBe(true);
    expect(hasOperationalAlerts(client)).toBe(false);
    expect(hasOperationalAlerts({ ...client, internalNotes: '  ' })).toBe(false);
    expect(hasOperationalAlerts({ ...client, internalNotes: 'Alérgica' })).toBe(true);
    expect(hasOperationalAlerts({ ...client, noShowCountLast90Days: 3 })).toBe(true);
  });

  it('uses the app when the account has an email', () => {
    expect(usesApp(client)).toBe(false);
    expect(usesApp({ ...client, email: 'maria@example.com' })).toBe(true);
  });

  it('labels blocked before verified, in the same tones in lists and detail', () => {
    expect(clientStatus({ isActive: true, isBlocked: true })).toEqual({
      label: 'clientStatusBlocked',
      tone: 'danger',
    });
    expect(clientStatus({ isActive: true, isBlocked: false })).toEqual({
      label: 'clientStatusVerified',
      tone: 'success',
    });
    expect(clientStatus({ isActive: false, isBlocked: false })).toEqual({
      label: 'clientStatusUnverified',
      tone: 'neutral',
    });
  });

  it('blocks and unblocks with the stored account, alias and notes included', () => {
    const stored = { ...client, adminAlias: 'Mari', internalNotes: 'VIP' };
    expect(clientBlockInput(stored, { reason: 'No se presenta' })).toEqual({
      firstName: 'María',
      lastName: 'Pérez',
      phone: '+34600111222',
      email: '',
      isActive: true,
      isBlocked: true,
      blockedReason: 'No se presenta',
      internalNotes: 'VIP',
      adminAlias: 'Mari',
    });
    expect(clientBlockInput({ ...stored, isBlocked: true, blockedReason: 'x' }, null)).toMatchObject({
      isBlocked: false,
      blockedReason: '',
      adminAlias: 'Mari',
    });
  });
});
