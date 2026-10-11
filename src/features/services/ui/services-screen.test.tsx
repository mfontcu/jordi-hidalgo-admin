import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { testSession as session } from '@/test/session';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { categoriesHandler, listResponse, serviceDto, servicesList } from '@/test/msw/services';
import { setViewport } from '@/test/match-media';
import { nth } from '@/test/nth';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER), categoriesHandler);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

const table = () => screen.findByRole('table', { name: 'Servicios' });
const search = () => app?.router.state.location.search;

describe('services list', () => {
  it('shows the summary and a row per service, with the first three category names', async () => {
    const list = servicesList();
    server.use(list.handler);
    app = renderApp('/services');

    const rows = within(await table()).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(nth(rows, 1)).getByText('Corte de Pelo')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('30 min')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('16.00 €')).toBeInTheDocument();
    expect(within(nth(rows, 2)).getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(await screen.findByText('Cabello, Barbería')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–2 de 2')).toBeInTheDocument();
    expect(Object.fromEntries(list.queries[0] ?? [])).toEqual({ page: '1', pageSize: '10', status: 'all' });
  });

  it('opens a service from its row and a new version from its action', async () => {
    server.use(
      servicesList().handler,
      http.get(`${API}/admin/services/:id`, () => HttpResponse.json(serviceDto())),
    );
    app = renderApp('/services');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Corte de Pelo' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/services/svc-1');
    });

    app.router.history.back();
    const rows = within(await table()).getAllByRole('row');
    await user.click(within(nth(rows, 2)).getByRole('button', { name: 'Nueva versión' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/services/svc-2/form');
    });
  });

  it('searches after a pause, keeps the text in the URL, and goes back to the first page', async () => {
    const list = servicesList();
    server.use(list.handler);
    app = renderApp('/services?page=2');
    const user = userEvent.setup();

    await user.type(await screen.findByRole('searchbox', { name: 'Buscar por nombre o categoría' }), 'barba');

    await waitFor(() => {
      expect(search()).toEqual({ search: 'barba' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('search')).toBe('barba');
    });
    // One request for the page it opened on, one for the whole word: the keystrokes wait.
    expect(list.queries.map((query) => query.get('search'))).toEqual([null, 'barba']);
  });

  it('filters by status or category from the panel, and clears the filter from its chip', async () => {
    const list = servicesList();
    server.use(list.handler);
    app = renderApp('/services');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Todos los servicios' }));
    await user.click(await screen.findByRole('radio', { name: 'Inactivos' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() => {
      expect(search()).toEqual({ status: 'inactive' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('status')).toBe('inactive');
    });

    await user.click(screen.getByRole('button', { name: 'Inactivos' }));
    await user.click(await screen.findByRole('radio', { name: 'Barbería' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() => {
      expect(search()).toEqual({ category: 'beard' });
    });
    expect(list.queries.at(-1)?.get('categoryCode')).toBe('beard');
    expect(list.queries.at(-1)?.get('status')).toBe('all');

    await user.click(screen.getByRole('button', { name: 'Quitar filtro: Barbería' }));
    await waitFor(() => {
      expect(search()).toEqual({});
    });
  });

  it('opens on the filters and page of the URL', async () => {
    const list = servicesList(() => listResponse(undefined, { page: 2, totalItems: 12 }));
    server.use(list.handler);
    app = renderApp('/services?category=hair&page=2');

    expect(await screen.findByText('Mostrando 11–12 de 12')).toBeInTheDocument();
    expect(Object.fromEntries(list.queries[0] ?? [])).toMatchObject({
      page: '2',
      categoryCode: 'hair',
      status: 'all',
    });
    expect(screen.getByRole('button', { name: 'Quitar filtro: Cabello' })).toBeInTheDocument();
  });

  it('pages through the list', async () => {
    const list = servicesList((query) =>
      listResponse(undefined, { page: Number(query.get('page')), totalItems: 25 }),
    );
    server.use(list.handler);
    app = renderApp('/services');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Mostrando 11–20 de 25')).toBeInTheDocument();
    expect(search()).toEqual({ page: 2 });
  });

  it('shows cards on a narrow screen', async () => {
    setViewport({ width: 390 });
    server.use(servicesList().handler);
    app = renderApp('/services');

    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // The summary starts folded.
    expect(screen.getByRole('button', { name: 'Resumen' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('invites to create a service when there is none', async () => {
    server.use(servicesList(() => listResponse([])).handler);
    app = renderApp('/services');
    const user = userEvent.setup();

    expect(await screen.findByText('No hay servicios configurados')).toBeInTheDocument();
    await user.click(nth(screen.getAllByRole('button', { name: 'Nuevo servicio' }), -1));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/services/form');
    });
  });

  it.each([
    [503, 'El servidor no está disponible en este momento. Inténtalo de nuevo en unos minutos.'],
    [500, 'Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.'],
    [429, 'Demasiadas peticiones seguidas. Espera un momento e inténtalo de nuevo.'],
  ])('reports a %i by its class and retries', async (status, message) => {
    let fail = true;
    server.use(
      http.get(`${API}/admin/services`, () =>
        fail ? new HttpResponse('boom\n', { status }) : HttpResponse.json(listResponse()),
      ),
    );
    app = renderApp('/services');
    const user = userEvent.setup();

    expect(await screen.findByText('No se pudieron cargar los servicios')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();

    fail = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await table()).toBeInTheDocument();
  });

  it('reports a network failure', async () => {
    server.use(http.get(`${API}/admin/services`, () => HttpResponse.error()));
    app = renderApp('/services');

    expect(
      await screen.findByText(
        'No se ha podido conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
  });
});
