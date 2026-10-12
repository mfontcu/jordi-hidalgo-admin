import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { liveBusinessHours } from '@/test/msw/schedule';
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

type User = ReturnType<typeof userEvent.setup>;

/** The nth button of that name; throws when the list is shorter, so the click has a real element. */
async function buttonNamed(name: string, index = 0) {
  const buttons = await screen.findAllByRole('button', { name });
  const button = buttons[index];
  if (!button) throw new Error(`missing button ${name} at ${index}`);
  return button;
}

/** Types a time in the picker that `field` opens (input mode, as with a mouse). */
async function pickTime(user: User, field: HTMLElement, time: string) {
  await user.click(field);
  const dialog = await screen.findByRole('dialog', { name: /Selecciona hora/ });
  const [hour, minute] = time.split(':');
  await user.clear(within(dialog).getByLabelText('Hora'));
  await user.type(within(dialog).getByLabelText('Hora'), hour ?? '');
  await user.clear(within(dialog).getByLabelText('Minuto'));
  await user.type(within(dialog).getByLabelText('Minuto'), minute ?? '');
  await user.click(within(dialog).getByRole('button', { name: 'Seleccionar' }));
}

describe('working hours', () => {
  it('shows the week, the summary, and each day’s shifts', async () => {
    server.use(...liveBusinessHours().handlers);
    app = renderApp('/schedule/working-hours');

    expect(await screen.findByRole('heading', { name: 'Martes' })).toBeInTheDocument();
    // Monday and Sunday are off.
    expect(screen.getAllByText('Día desactivado. No se mostrarán huecos disponibles.')).toHaveLength(2);
    // The earliest slot is the morning one, whatever the order the backend sends.
    expect(screen.getAllByText('09:00 - 13:00')[0]).toBeInTheDocument();
    expect(screen.getByText('16:00 - 20:00')).toBeInTheDocument();
    expect(screen.getAllByText('Sin definir').length).toBeGreaterThan(0);
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('turns a day on', async () => {
    const live = liveBusinessHours();
    server.use(...live.handlers);
    app = renderApp('/schedule/working-hours');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('switch', { name: 'Lunes' }));

    await waitFor(() => {
      expect(live.calls).toContainEqual({ method: 'PATCH', path: 'weekdays/1', body: { isActive: true } });
    });
    expect(await screen.findByText('09:00 - 15:00')).toBeInTheDocument();
  });

  it('refuses a morning shift that runs into the afternoon, then saves the corrected one', async () => {
    const live = liveBusinessHours();
    server.use(...live.handlers);
    app = renderApp('/schedule/working-hours');
    const user = userEvent.setup();

    await user.click(await buttonNamed('Editar'));
    expect(await screen.findByText('Franja de mañana')).toBeInTheDocument();
    await pickTime(user, screen.getByRole('button', { name: /Fin/ }), '17:00');
    await user.click(screen.getByRole('button', { name: 'Guardar franja' }));
    expect(await screen.findByText('Se solapa con la otra franja (16:00 - 20:00).')).toBeInTheDocument();
    expect(live.calls).toEqual([]);

    await pickTime(user, screen.getByRole('button', { name: /Fin/ }), '14:00');
    await user.click(screen.getByRole('button', { name: 'Guardar franja' }));

    await waitFor(() => {
      expect(live.calls).toContainEqual({
        method: 'PATCH',
        path: 'slots/tue-1',
        body: { startTime: '09:00', endTime: '14:00', isActive: true },
      });
    });
    // Tuesday's new morning, and Saturday's.
    await waitFor(() => {
      expect(screen.getAllByText('09:00 - 14:00')).toHaveLength(2);
    });
  });

  it('moves the end half an hour after a new start that passes it', async () => {
    server.use(...liveBusinessHours().handlers);
    app = renderApp('/schedule/working-hours');
    const user = userEvent.setup();

    await user.click(await buttonNamed('Editar'));
    await pickTime(user, await screen.findByRole('button', { name: /Inicio/ }), '13:30');

    expect(screen.getByRole('button', { name: /Fin/ })).toHaveTextContent('14:00');
  });

  it('asks before deleting a shift', async () => {
    const live = liveBusinessHours();
    server.use(...live.handlers);
    app = renderApp('/schedule/working-hours');
    const user = userEvent.setup();

    await user.click(await buttonNamed('Eliminar', 1));
    const dialog = await screen.findByRole('dialog', { name: 'Eliminar franja' });
    expect(dialog).toHaveTextContent('Se eliminará la franja de tarde del Martes (16:00 - 20:00).');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(live.calls).toContainEqual({ method: 'DELETE', path: 'slots/tue-2', body: null });
    });
  });

  it('names what failed when a change is refused', async () => {
    server.use(...liveBusinessHours().handlers);
    server.use(
      http.patch(`${API}/admin/business-hours/weekdays/:weekday`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );
    app = renderApp('/schedule/working-hours');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('switch', { name: 'Martes' }));

    expect(
      await screen.findByText(/No se pudo actualizar el día\./, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
  });
});
