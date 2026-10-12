import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { setViewport } from '@/test/match-media';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { slotWatchCancel, slotWatchDto, slotWatchesList, SLOT_WATCHES } from '@/test/msw/slot-watches';
import { appointmentsList, appointmentsListResponse } from '@/test/msw/appointments';
import { clientDto, userDetail } from '@/test/msw/users';
import { nth } from '@/test/nth';
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

const table = () => screen.findByRole('table', { name: 'Avisos de hueco' });
const search = () => app?.router.state.location.search;

describe('slot-watch demand', () => {
  it('shows the counts over the loaded list and a row per watch', async () => {
    const list = slotWatchesList();
    server.use(list.handler);
    app = renderApp('/schedule/slot-watches');

    const rows = within(await table()).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(nth(rows, 1)).getByText('Ana Ruiz')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('Corte')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('12/10, 13/10')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('10:00–14:00')).toBeInTheDocument();
    expect(within(nth(rows, 2)).getByText('Hold hasta 10:12')).toBeInTheDocument();
    expect(screen.getByText('Mejoras de cita')).toBeInTheDocument();
    expect(Object.fromEntries(list.queries[0] ?? [])).toEqual({});
  });

  it('searches by name on the loaded list and keeps the text in the URL', async () => {
    const list = slotWatchesList();
    server.use(list.handler);
    app = renderApp('/schedule/slot-watches');
    const user = userEvent.setup();

    await user.type(
      await screen.findByRole('searchbox', { name: 'Buscar cliente por nombre o email' }),
      'luis',
    );

    await waitFor(() => {
      expect(search()).toEqual({ search: 'luis' });
    });
    const rows = within(await table()).getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(within(nth(rows, 1)).getByText('Luis Gómez')).toBeInTheDocument();
    expect(list.queries).toHaveLength(1);
  });

  it('filters by status from the panel and clears it from the chip', async () => {
    server.use(slotWatchesList().handler);
    app = renderApp('/schedule/slot-watches');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Todos los estados' }));
    await user.click(await screen.findByRole('radio', { name: 'Hold' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(search()).toEqual({ status: 'held' });
    });
    expect(within(await table()).getAllByRole('row')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Quitar filtro: Hold' }));
    await waitFor(() => {
      expect(search()).toEqual({});
    });
    expect(within(await table()).getAllByRole('row')).toHaveLength(3);
  });

  it('cancels a watch from its row and drops it from the list', async () => {
    const cancel = slotWatchCancel('w-1');
    server.use(slotWatchesList().handler, cancel.handler);
    app = renderApp('/schedule/slot-watches');
    const user = userEvent.setup();

    const rows = within(await table()).getAllByRole('row');
    await user.click(within(nth(rows, 1)).getByRole('button', { name: 'Cancelar aviso' }));
    const dialog = await screen.findByRole('dialog', { name: '¿Cancelar este aviso?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar aviso' }));

    expect(await screen.findByText('Aviso cancelado')).toBeInTheDocument();
    expect(within(await table()).queryByText('Ana Ruiz')).not.toBeInTheDocument();
    expect(cancel.calls).toEqual(['w-1']);
  });

  it('opens the client from the row', async () => {
    server.use(
      slotWatchesList().handler,
      userDetail(clientDto({ id: 'cli-1' })),
      appointmentsList(() => appointmentsListResponse([])).handler,
    );
    app = renderApp('/schedule/slot-watches');
    const user = userEvent.setup();

    const rows = within(await table()).getAllByRole('row');
    await user.click(within(nth(rows, 1)).getByRole('button', { name: 'Ver cliente' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients/cli-1');
    });
  });

  it('shows the load error and retries', async () => {
    server.use(
      http.get(`${API}/admin/slot-watches`, () => HttpResponse.text('internal error', { status: 500 })),
    );
    app = renderApp('/schedule/slot-watches');

    const errorTitle = await screen.findByText('No se pudieron cargar los avisos');
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    const emptyState = errorTitle.parentElement;
    if (!emptyState) throw new Error('missing empty state');

    server.use(slotWatchesList([slotWatchDto()]).handler);
    await userEvent.click(within(emptyState).getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
  });

  it('lists the watches as cards on a narrow screen', async () => {
    setViewport({ width: 390 });
    server.use(slotWatchesList().handler);
    app = renderApp('/schedule/slot-watches');

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Avisos de hueco' })).not.toBeInTheDocument();
    expect(screen.getByText(SLOT_WATCHES[0]?.userEmail ?? '')).toBeInTheDocument();
  });
});
