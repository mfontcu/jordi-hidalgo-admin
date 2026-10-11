import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { testSession as session } from '@/test/session';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { categoriesHandler, serviceDetail, serviceDto, servicesList } from '@/test/msw/services';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER), categoriesHandler, servicesList().handler);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

const path = () => app?.router.state.location.pathname;

/** `POST /admin/services`, recording the body; answers with the new service. */
function createHandler() {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${API}/admin/services`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(serviceDto({ id: 'svc-new' }), { status: 201 });
    }),
    serviceDetail(serviceDto({ id: 'svc-new' })),
  );
  return bodies;
}

describe('service form', () => {
  it('validates on submit and creates the service with the first category', async () => {
    const bodies = createHandler();
    app = renderApp('/services/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Crear servicio' }));
    expect(screen.getByText('Introduce el nombre en español')).toBeInTheDocument();
    expect(screen.getByText('Introduce el nom en català')).toBeInTheDocument();
    expect(screen.getByText('Enter the English name')).toBeInTheDocument();
    expect(screen.getByText('Introduce el precio')).toBeInTheDocument();
    expect(bodies).toEqual([]);

    expect(screen.getByLabelText('Categoría')).toHaveValue('Cabello');
    await user.type(screen.getByLabelText('Nombre (ES)'), 'Corte');
    await user.type(screen.getByLabelText('Nombre (CA)'), 'Tall');
    await user.type(screen.getByLabelText('Name (EN)'), 'Haircut');
    await user.clear(screen.getByLabelText('Duración (min)'));
    await user.type(screen.getByLabelText('Duración (min)'), '45');
    await user.type(screen.getByLabelText('Precio (€)'), '18,5');
    await user.type(screen.getByLabelText('Descripción (ES)'), 'Clásico');
    await user.click(screen.getByRole('switch', { name: 'Página de precios del sitio web' }));
    await user.click(screen.getByRole('button', { name: 'Crear servicio' }));

    await waitFor(() => {
      expect(path()).toBe('/services/svc-new');
    });
    expect(await screen.findByText('Servicio creado.')).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        serviceCategoryId: 'cat-hair',
        durationMinutes: 45,
        priceCents: 1850,
        isActive: true,
        displayOrder: 0,
        showOnPublicSite: true,
        translations: [
          { locale: 'es', name: 'Corte', description: 'Clásico' },
          { locale: 'ca', name: 'Tall', description: '' },
          { locale: 'en', name: 'Haircut', description: '' },
        ],
      },
    ]);
  });

  it('picks and clears the category', async () => {
    app = renderApp('/services/form');
    const user = userEvent.setup();

    const field = await screen.findByLabelText('Categoría');
    await user.click(screen.getByRole('button', { name: 'Limpiar categoría' }));
    expect(field).toHaveValue('');

    await user.click(field);
    await user.click(await screen.findByRole('button', { name: 'Barbería' }));
    expect(field).toHaveValue('Barbería');
  });

  it('prefills a new version from the base service and shows it above the form', async () => {
    const bodies = createHandler();
    server.use(serviceDetail(serviceDto({ priceCents: 1250 })));
    app = renderApp('/services/svc-1/form');
    const user = userEvent.setup();

    expect(await screen.findByText('Servicio base')).toBeInTheDocument();
    expect(screen.getByText('Cabello · 30 min · 12.50 €')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre (CA)')).toHaveValue('Tall de cabell');
    expect(screen.getByLabelText('Precio (€)')).toHaveValue('12.5');

    await user.click(screen.getByRole('button', { name: 'Crear nueva versión' }));

    expect(await screen.findByText('Nueva versión creada.')).toBeInTheDocument();
    expect(bodies).toEqual([expect.objectContaining({ priceCents: 1250, serviceCategoryId: 'cat-hair' })]);
  });

  it('asks before leaving with unsaved changes, and stays when asked to', async () => {
    app = renderApp('/services/form');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre (ES)'), 'Corte');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Cambios sin guardar' });
    await user.click(within(dialog).getByRole('button', { name: 'Seguir editando' }));
    expect(path()).toBe('/services/form');
    expect(screen.getByLabelText('Nombre (ES)')).toHaveValue('Corte');

    await user.click(screen.getByRole('button', { name: 'Volver a servicios' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Descartar' }));
    await waitFor(() => {
      expect(path()).toBe('/services');
    });
  });

  it('leaves without asking when nothing changed', async () => {
    app = renderApp('/services/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(path()).toBe('/services');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the form and reports a rejected save', async () => {
    server.use(
      http.post(
        `${API}/admin/services`,
        () => new HttpResponse('invalid service category\n', { status: 400 }),
      ),
    );
    server.use(serviceDetail());
    app = renderApp('/services/svc-1/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Crear nueva versión' }));

    expect(
      await screen.findByText(
        'No se pudo guardar el servicio. El servidor ha rechazado los datos: invalid service category',
      ),
    ).toBeInTheDocument();
    expect(path()).toBe('/services/svc-1/form');
  });

  it('offers a retry when the categories cannot load', async () => {
    let fail = true;
    server.use(
      http.get(`${API}/admin/services/categories`, () =>
        fail ? new HttpResponse('internal error\n', { status: 500 }) : HttpResponse.json({ items: [] }),
      ),
    );
    app = renderApp('/services/form');
    const user = userEvent.setup();

    expect(await screen.findByText('No se pudieron cargar las categorías del catálogo.')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByLabelText('Nombre (ES)')).toBeInTheDocument();
  });
});
