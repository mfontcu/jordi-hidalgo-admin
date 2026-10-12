import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { addDays, businessToday, dayEndInstant, dayStartInstant } from '@/shared/lib/business-time';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { userDto, usersList, usersListResponse } from '@/test/msw/users';
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

const table = () => screen.findByRole('table', { name: 'Administrador' });
const search = () => app?.router.state.location.search;

describe('staff list', () => {
  it('asks for admin accounts and shows the summary and a row per account', async () => {
    const list = usersList();
    server.use(list.handler);
    app = renderApp('/admins');

    const rows = within(await table()).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(nth(rows, 1)).getByText('Jordi Hidalgo')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('10 ene 2026')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('Activo')).toBeInTheDocument();
    // An empty phone is a dash.
    expect(within(nth(rows, 2)).getByText('—')).toBeInTheDocument();
    expect(within(nth(rows, 2)).getByText('Inactivo')).toBeInTheDocument();
    // Total 7, active 7 − 2 inactive.
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(Object.fromEntries(list.queries[0] ?? [])).toEqual({
      role: 'admin',
      page: '1',
      pageSize: '10',
      status: 'all',
    });
  });

  it('opens an account from its row', async () => {
    server.use(
      usersList().handler,
      http.get(`${API}/admin/users/:id`, () => HttpResponse.json(userDto({ id: 'usr-2' }))),
    );
    app = renderApp('/admins');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Ana López' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/admins/usr-2');
    });
  });

  it('searches after a pause and keeps the text in the URL', async () => {
    const list = usersList();
    server.use(list.handler);
    app = renderApp('/admins?page=2');
    const user = userEvent.setup();

    await user.type(
      await screen.findByRole('searchbox', { name: 'Buscar por nombre, teléfono o email' }),
      'ana',
    );

    await waitFor(() => {
      expect(search()).toEqual({ search: 'ana' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('search')).toBe('ana');
    });
    expect(list.queries.map((query) => query.get('search'))).toEqual([null, 'ana']);
  });

  it('filters by status from the panel, and clears the filter from its chip', async () => {
    const list = usersList();
    server.use(list.handler);
    app = renderApp('/admins');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Todos los administradores' }));
    await user.click(await screen.findByRole('radio', { name: 'Inactivos' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() => {
      expect(search()).toEqual({ status: 'inactive' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('status')).toBe('inactive');
    });

    await user.click(screen.getByRole('button', { name: 'Quitar filtro: Inactivos' }));
    await waitFor(() => {
      expect(search()).toEqual({});
    });
  });

  it('filters by registration date: a quick pick, then a range', async () => {
    const list = usersList();
    server.use(list.handler);
    app = renderApp('/admins');
    const user = userEvent.setup();
    const today = businessToday();

    await user.click(await screen.findByRole('button', { name: 'Todo el historial' }));
    await user.click(await screen.findByRole('button', { name: /^Hoy · / }));
    await waitFor(() => {
      expect(search()).toEqual({ date: 'today' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('dateFrom')).toBe(dayStartInstant(today));
    });
    expect(list.queries.at(-1)?.get('dateTo')).toBe(dayEndInstant(today));
    expect(screen.getByRole('button', { name: 'Quitar filtro: Hoy' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoy' }));
    await user.click(await screen.findByRole('button', { name: 'Elegir rango...' }));
    const dialog = await screen.findByRole('dialog', { name: 'Elegir rango' });
    await user.click(within(dialog).getByRole('button', { name: 'Últimos 7 días' }));
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar rango' }));

    await waitFor(() => {
      expect(search()).toEqual({ from: addDays(today, -6), to: today });
    });
    expect(list.queries.at(-1)?.get('dateFrom')).toBe(dayStartInstant(addDays(today, -6)));
  });

  it('opens on the filters and page of the URL', async () => {
    const list = usersList(() => usersListResponse(undefined, { page: 2, totalItems: 12 }));
    server.use(list.handler);
    app = renderApp('/admins?status=active&from=2026-10-01&to=2026-10-05&page=2');

    expect(await screen.findByText('Mostrando 11–12 de 12')).toBeInTheDocument();
    expect(Object.fromEntries(list.queries[0] ?? [])).toMatchObject({
      page: '2',
      status: 'active',
      dateFrom: '2026-09-30T22:00:00.000Z',
      dateTo: '2026-10-05T21:59:59.000Z',
    });
    expect(screen.getByRole('button', { name: 'Quitar filtro: 1 oct · 5 oct' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro: Activos' })).toBeInTheDocument();
  });

  it('shows cards on a narrow screen', async () => {
    setViewport({ width: 390 });
    server.use(usersList().handler);
    app = renderApp('/admins');

    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(nth(cards, 0)).getByText('Alta')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('invites to create an account when there is none', async () => {
    server.use(usersList(() => usersListResponse([])).handler);
    app = renderApp('/admins');
    const user = userEvent.setup();

    expect(await screen.findByText('No hay administradores')).toBeInTheDocument();
    await user.click(nth(screen.getAllByRole('button', { name: 'Nuevo administrador' }), -1));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/admins/form');
    });
  });

  it('reports a failure by its class and retries', async () => {
    let fail = true;
    server.use(
      http.get(`${API}/admin/users`, () =>
        fail ? new HttpResponse('boom\n', { status: 500 }) : HttpResponse.json(usersListResponse()),
      ),
    );
    app = renderApp('/admins');
    const user = userEvent.setup();

    expect(await screen.findByText('No se pudieron cargar los administradores.')).toBeInTheDocument();
    expect(
      screen.getByText('Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.'),
    ).toBeInTheDocument();

    fail = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await table()).toBeInTheDocument();
  });
});
