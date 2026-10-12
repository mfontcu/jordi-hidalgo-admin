import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { CLIENTS, usersList, usersListResponse } from '@/test/msw/users';
import { setViewport } from '@/test/match-media';
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

const table = () => screen.findByRole('table', { name: 'Cliente' });
const search = () => app?.router.state.location.search;
const clientsList = () => usersList(() => usersListResponse(CLIENTS));

describe('clients list', () => {
  it('asks for customers and shows the alias, both appointment dates, and the client status', async () => {
    const list = clientsList();
    server.use(list.handler);
    app = renderApp('/clients');

    const rows = within(await table()).getAllByRole('row');
    expect(rows).toHaveLength(3);
    // The alias first; the next appointment with its salon time (16:30 in Madrid).
    expect(within(nth(rows, 1)).getByText('Mari')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('1 oct 2026')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('20 oct 2026 · 16:30')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('Verificado')).toBeInTheDocument();
    expect(within(nth(rows, 2)).getByText('Luis Gómez')).toBeInTheDocument();
    expect(within(nth(rows, 2)).getByText('Sin verificar')).toBeInTheDocument();
    expect(screen.getByText('Con cita próxima')).toBeInTheDocument();
    expect(Object.fromEntries(list.queries[0] ?? [])).toEqual({
      role: 'customer',
      page: '1',
      pageSize: '10',
      status: 'all',
    });
  });

  it('filters by any client status, sending the value the API takes', async () => {
    const list = clientsList();
    server.use(list.handler);
    app = renderApp('/clients');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Todos los clientes' }));
    await user.click(await screen.findByRole('radio', { name: 'Sin verificar' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() => {
      expect(search()).toEqual({ status: 'inactive' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('status')).toBe('inactive');
    });

    await user.click(screen.getByRole('button', { name: 'Quitar filtro: Sin verificar' }));
    await waitFor(() => {
      expect(search()).toEqual({});
    });
  });

  it('reads a status from a hand-written URL', async () => {
    const list = clientsList();
    server.use(list.handler);
    app = renderApp('/clients?status=with_upcoming_appointment');

    await table();
    expect(list.queries[0]?.get('status')).toBe('with_upcoming_appointment');
    expect(screen.getByRole('button', { name: 'Quitar filtro: Con cita próxima' })).toBeInTheDocument();
  });

  it('opens a client from its row, and a new client from the toolbar', async () => {
    server.use(
      clientsList().handler,
      http.get(`${API}/admin/users/:id`, () => HttpResponse.json(CLIENTS[1])),
      http.get(`${API}/admin/appointments`, () => HttpResponse.json({ items: [], pagination: {} })),
    );
    app = renderApp('/clients');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Luis Gómez' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients/cli-2');
    });

    app.router.history.back();
    await user.click(await screen.findByRole('button', { name: 'Nuevo cliente' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients/form');
    });
  });

  it('shows the cards on narrow screens', async () => {
    setViewport({ width: 390 });
    server.use(clientsList().handler);
    app = renderApp('/clients');

    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(nth(cards, 0)).getByText('Próxima cita')).toBeInTheDocument();
    expect(within(nth(cards, 0)).getByText('20 oct 2026 · 16:30')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('offers a new client when there is none', async () => {
    server.use(usersList(() => usersListResponse([])).handler);
    app = renderApp('/clients');
    expect(await screen.findByText('No hay clientes para mostrar')).toBeInTheDocument();
  });

  it('offers a retry when the list fails', async () => {
    let fail = true;
    server.use(
      http.get(`${API}/admin/users`, () =>
        fail ? new HttpResponse('boom\n', { status: 500 }) : HttpResponse.json(usersListResponse(CLIENTS)),
      ),
    );
    app = renderApp('/clients');
    const user = userEvent.setup();

    expect(await screen.findByText('No se pudieron cargar los clientes.')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await table()).toBeInTheDocument();
  });
});
