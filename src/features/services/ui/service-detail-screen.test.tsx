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
const toast = (text: string) => screen.findByText(text, {}, { timeout: 2000 });

/** A detail whose state the PATCH and DELETE handlers change, as the backend does. */
function liveService(overrides: Record<string, unknown> = {}) {
  let service = serviceDto(overrides);
  const calls: string[] = [];
  server.use(
    http.get(`${API}/admin/services/svc-1`, () => HttpResponse.json(service)),
    http.patch(`${API}/admin/services/svc-1/:action`, async ({ params, request }) => {
      calls.push(`PATCH ${String(params.action)}`);
      if (params.action === 'deactivate') service = { ...service, isActive: false };
      if (params.action === 'activate') service = { ...service, isActive: true };
      if (params.action === 'display-order') {
        service = { ...service, ...((await request.json()) as object) };
        return HttpResponse.json(service);
      }
      if (params.action === 'show-on-public-site') {
        service = { ...service, ...((await request.json()) as object) };
        return HttpResponse.json(service);
      }
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(`${API}/admin/services/svc-1`, () => {
      calls.push('DELETE');
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return calls;
}

describe('service detail', () => {
  it('shows the service, its translations, and its availability', async () => {
    liveService();
    app = renderApp('/services/svc-1');

    expect(await screen.findByText('Cabello · 30 min · 16.00 €')).toBeInTheDocument();
    // The summary pill and the availability row's label.
    expect(screen.getAllByText('Disponible para reservas')).toHaveLength(2);
    expect(screen.getByText('Visible en la web')).toBeInTheDocument();
    expect(screen.getByText('30 minutos')).toBeInTheDocument();
    expect(screen.getByText('Tall de cabell')).toBeInTheDocument();
    expect(screen.getByText('Classic haircut')).toBeInTheDocument();
    expect(screen.getByLabelText('Prioridad')).toHaveValue('1');
  });

  it('deactivates after confirmation and shows the new state', async () => {
    const calls = liveService();
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Desactivar servicio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Desactivar servicio' });
    await user.click(within(dialog).getByRole('button', { name: 'Desactivar' }));

    expect(await screen.findByRole('button', { name: 'Activar servicio' })).toBeInTheDocument();
    expect(screen.getByText('No disponible para reservas')).toBeInTheDocument();
    expect(calls).toEqual(['PATCH deactivate']);
  });

  it('does nothing when the confirmation is cancelled', async () => {
    const calls = liveService({ isActive: false });
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Activar servicio' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it('deletes after confirmation and goes back to the list', async () => {
    const calls = liveService();
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar servicio' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(path()).toBe('/services');
    });
    expect(calls).toEqual(['DELETE']);
  });

  it('reports a failed action by its error class', async () => {
    liveService();
    server.use(http.delete(`${API}/admin/services/svc-1`, () => HttpResponse.error()));
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar servicio' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(
      await toast(
        'No se pudo eliminar el servicio. No se ha podido conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
    expect(path()).toBe('/services/svc-1');
  });

  it('saves the catalog order, and reports an invalid one under the field', async () => {
    const calls = liveService();
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();
    const field = await screen.findByLabelText('Prioridad');

    await user.clear(field);
    await user.type(field, '-2');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Introduce un número entero mayor o igual que 0.')).toBeInTheDocument();
    expect(calls).toEqual([]);

    await user.clear(field);
    await user.type(field, '7');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await toast('Prioridad actualizada.')).toBeInTheDocument();
    expect(calls).toEqual(['PATCH display-order']);
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });

  it('puts the stored order back when the save fails', async () => {
    liveService();
    server.use(
      http.patch(
        `${API}/admin/services/svc-1/display-order`,
        () => new HttpResponse('displayOrder invalid\n', { status: 400 }),
      ),
    );
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();
    const field = await screen.findByLabelText('Prioridad');

    await user.clear(field);
    await user.type(field, '9');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(
      await toast(
        'No se pudo actualizar la prioridad. El servidor ha rechazado los datos: displayOrder invalid',
      ),
    ).toBeInTheDocument();
    expect(field).toHaveValue('1');
  });

  it('flips the web visibility at once and flips it back when the server refuses', async () => {
    liveService();
    let release: () => void = () => undefined;
    server.use(
      http.patch(`${API}/admin/services/svc-1/show-on-public-site`, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return new HttpResponse('internal error\n', { status: 500 });
      }),
    );
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('switch', { name: 'Página de precios del sitio web' }));
    expect(
      screen.getByText('No se muestra ahí; el servicio sigue disponible para reservas como hasta ahora.'),
    ).toBeInTheDocument();

    release();
    expect(
      await toast(
        'No se pudo actualizar la visibilidad en la web. Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Página de precios del sitio web' })).toBeChecked();
  });

  it('opens the new version form of the service', async () => {
    liveService();
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Crear nueva versión' }));

    await waitFor(() => {
      expect(path()).toBe('/services/svc-1/form');
    });
  });

  it('goes back to the list from a direct link', async () => {
    server.use(serviceDetail());
    app = renderApp('/services/svc-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Volver a servicios' }));

    await waitFor(() => {
      expect(path()).toBe('/services');
    });
  });

  it('says so when the service does not exist', async () => {
    server.use(
      http.get(`${API}/admin/services/gone`, () => new HttpResponse('service not found\n', { status: 404 })),
    );
    app = renderApp('/services/gone');

    expect(await screen.findByText('No se encontró el servicio.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
