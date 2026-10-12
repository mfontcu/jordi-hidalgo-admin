import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { setViewport } from '@/test/match-media';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import {
  blockedSlotDto,
  blockedSlotsList,
  blockedSlotsListResponse,
  ruleDto,
  rulesList,
  rulesListResponse,
} from '@/test/msw/schedule';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';
import { testSession as session } from '@/test/session';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

const search = () => app?.router.state.location.search as Record<string, unknown> | undefined;
const slots = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    blockedSlotDto({ id: `blk-${index}`, reason: `Bloqueo ${index}` }),
  );

describe('punctual blocked slots', () => {
  it('pages through every block of the filters, which Flutter cuts at ten', async () => {
    const list = blockedSlotsList((query) =>
      blockedSlotsListResponse(query.get('page') === '4' ? slots(2) : slots(10), {
        full_day_closures: 1,
        partial_blocked_ranges: 31,
      }),
    );
    server.use(list.handler);
    app = renderApp('/schedule/blocked-slots');
    const user = userEvent.setup();

    expect(await screen.findByText('Mostrando 1–10 de 32')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 4')).toBeInTheDocument();
    for (let page = 0; page < 3; page += 1)
      await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Mostrando 31–32 de 32')).toBeInTheDocument();
    expect(search()).toMatchObject({ page: 4 });
    expect(list.queries.at(-1)?.get('page_size')).toBe('10');
  });

  it('shows a full day, its hours, and its pills in salon time', async () => {
    server.use(
      blockedSlotsList(() =>
        blockedSlotsListResponse([
          blockedSlotDto({
            id: 'full',
            start_at: '2026-03-28T23:00:00Z',
            end_at: '2026-03-29T21:59:00Z',
            reason: 'Cierre',
          }),
          blockedSlotDto({ show_on_public_site: true }),
        ]),
      ).handler,
    );
    app = renderApp('/schedule/blocked-slots');

    const table = await screen.findByRole('table');
    expect(within(table).getByText('29 mar 2026')).toBeInTheDocument();
    expect(within(table).getAllByText('Día completo')).toHaveLength(2);
    expect(within(table).getByText('12:14 - 14:14')).toBeInTheDocument();
    expect(within(table).getByText('Visible en la web')).toBeInTheDocument();
  });

  it('keeps the search, date, and type in the URL and sends them', async () => {
    const list = blockedSlotsList(() => blockedSlotsListResponse(slots(1)));
    server.use(list.handler);
    app = renderApp('/schedule/blocked-slots?date=nextMonth&type=range');
    const user = userEvent.setup();

    expect(await screen.findByRole('button', { name: /^Quitar filtro: .*Próximo mes/ })).toBeInTheDocument();
    expect(list.queries.at(-1)?.get('type')).toBe('range');
    expect(list.queries.at(-1)?.get('date_from')).toMatch(/Z$/);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por motivo' }), 'fisio');
    await waitFor(() => {
      expect(search()).toMatchObject({ search: 'fisio', date: 'nextMonth', type: 'range' });
    });
    await user.click(screen.getByRole('button', { name: /^Quitar filtro: .*Franja/ }));
    await waitFor(() => {
      expect(search()?.type).toBeUndefined();
    });
    expect(list.queries.at(-1)?.get('type')).toBe('all');
  });

  it('deletes after confirmation and reports a failure', async () => {
    server.use(blockedSlotsList(() => blockedSlotsListResponse(slots(1))).handler);
    server.use(http.delete(`${API}/admin/blocked-slots/blk-0`, () => HttpResponse.json({}, { status: 500 })));
    app = renderApp('/schedule/blocked-slots');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar bloqueo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Eliminar bloqueo' });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByText(/No se ha podido eliminar el bloqueo\./, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
  });

  it('switches to the recurring tab without the punctual filters', async () => {
    server.use(blockedSlotsList(() => blockedSlotsListResponse([])).handler);
    server.use(rulesList(() => rulesListResponse([ruleDto()])).handler);
    app = renderApp('/schedule/blocked-slots?type=range&page=2');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Recurrentes' }));

    expect(
      await screen.findByRole('heading', { name: 'Bloqueos recurrentes', level: 1 }),
    ).toBeInTheDocument();
    expect(search()).toEqual({ tab: 'recurring' });
  });
});

describe('recurring blocked slots', () => {
  it('lists the active rules first, with their next application', async () => {
    const list = rulesList(() => rulesListResponse([ruleDto({ reason: '' })]));
    server.use(list.handler);
    app = renderApp('/schedule/blocked-slots?tab=recurring');

    // From 1400px the table splits time, reason, and next application into columns.
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Martes')).toBeInTheDocument();
    expect(within(table).getByText('11:00 - 11:30')).toBeInTheDocument();
    // An empty reason reads "No reason set", in the reader's language.
    expect(within(table).getByText('Sin motivo definido')).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /Próxima aplicación/ })).toBeInTheDocument();
    expect(list.queries.at(-1)?.get('status')).toBe('active');
  });

  it('joins time and reason in one column under 1400px', async () => {
    setViewport({ width: 1200 });
    server.use(rulesList(() => rulesListResponse([ruleDto({ reason: '' })])).handler);
    app = renderApp('/schedule/blocked-slots?tab=recurring');

    const table = await screen.findByRole('table');
    expect(within(table).getByText('11:00 - 11:30 · Sin motivo definido')).toBeInTheDocument();
  });

  it('filters by weekday and status in the URL', async () => {
    const list = rulesList(() => rulesListResponse([]));
    server.use(list.handler);
    app = renderApp('/schedule/blocked-slots?tab=recurring');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Todos los días' }));
    await user.click(await screen.findByRole('button', { name: 'Miércoles' }));
    await waitFor(() => {
      expect(search()).toMatchObject({ tab: 'recurring', weekday: 3 });
    });
    expect(list.queries.at(-1)?.get('weekday')).toBe('3');
    expect(await screen.findByText('No hay bloqueos recurrentes configurados')).toBeInTheDocument();
  });

  it('deletes a rule after confirmation with a toast', async () => {
    let rules = [ruleDto()];
    server.use(rulesList(() => rulesListResponse(rules)).handler);
    server.use(
      http.delete(`${API}/admin/recurring-blocked-slots/rule-1`, () => {
        rules = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    app = renderApp('/schedule/blocked-slots?tab=recurring');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByText('Bloqueo recurrente eliminado correctamente.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
  });
});
