import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { liveBusiness } from '@/test/msw/business';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';
import { testSession as session } from '@/test/session';

let app: ReturnType<typeof renderApp> | undefined;

beforeAll(() => {
  // Radix Select calls these on pointerdown; jsdom does not implement them.
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
  HTMLElement.prototype.scrollIntoView = () => undefined;
});

type Setting = Record<string, unknown>;

const reminderPush = (): Setting => ({
  id: 'n-push',
  notificationTypeId: 't-reminder',
  notificationTypeCode: 'appointment_reminder',
  notificationTypeName: 'Recordatorio de cita',
  notificationTypeDescription: 'Aviso antes de la cita',
  notificationChannelId: 'c-push',
  notificationChannelCode: 'push',
  notificationChannelName: 'Push',
  isEnabled: true,
  sendBeforeMinutes: 60,
  configurable: true,
});

const reminderEmail = (): Setting => ({
  id: 'n-email',
  notificationTypeId: 't-reminder',
  notificationTypeCode: 'appointment_reminder',
  notificationTypeName: 'Recordatorio de cita',
  notificationTypeDescription: 'Aviso antes de la cita',
  notificationChannelId: 'c-email',
  notificationChannelCode: 'email',
  notificationChannelName: 'Email',
  isEnabled: false,
  sendAtLocalTime: '08:00',
  configurable: true,
});

const changePush = (): Setting => ({
  id: 'n-change',
  notificationTypeId: 't-change',
  notificationTypeCode: 'appointment_change',
  notificationTypeName: 'Cambio de cita',
  notificationTypeDescription: '',
  notificationChannelId: 'c-push',
  notificationChannelCode: 'push',
  notificationChannelName: 'Push',
  isEnabled: false,
  configurable: false,
});

const changeEmail = (): Setting => ({
  id: 'n-change-email',
  notificationTypeId: 't-change',
  notificationTypeCode: 'appointment_change',
  notificationTypeName: 'Cambio de cita',
  notificationTypeDescription: '',
  notificationChannelId: 'c-email',
  notificationChannelCode: 'email',
  notificationChannelName: 'Email',
  isEnabled: true,
  configurable: false,
});

function section(name: string) {
  const heading = screen.getByRole('heading', { name });
  const card = heading.closest('section');
  if (!card) throw new Error(`no section for ${name}`);
  return within(card);
}

/** Stateful notification list, so a successful patch survives the refetch. */
function notificationsApi(rows: Setting[], patchStatus: number | ((id: string) => number) = 204) {
  const settings = rows.map((row) => ({ ...row }));
  const calls: { id: string; body: unknown }[] = [];
  return {
    calls,
    handlers: [
      http.get(`${API}/admin/business/notifications`, () => HttpResponse.json(settings)),
      http.patch(`${API}/admin/business/notifications/:settingID`, async ({ params, request }) => {
        const id = String(params.settingID);
        const body = await request.json();
        calls.push({ id, body });
        const status = typeof patchStatus === 'function' ? patchStatus(id) : patchStatus;
        if (status === 204) {
          const row = settings.find((item) => item.id === id);
          if (row) Object.assign(row, body);
        }
        return new HttpResponse(status === 204 ? null : 'minutes out of range\n', { status });
      }),
    ],
  };
}

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

describe('notifications tab', () => {
  it('locks a row that is not configurable and does not save it', async () => {
    const api = notificationsApi([changePush(), changeEmail()]);
    server.use(...api.handlers, ...liveBusiness().handlers);
    app = renderApp('/business?tab=notifications');
    const user = userEvent.setup();

    const change = await screen.findByRole('heading', { name: 'Cambio de cita' });
    expect(change).toBeInTheDocument();
    const card = section('Cambio de cita');
    expect(
      card.getByText('Se envía siempre que la clienta tenga las notificaciones del móvil activadas.'),
    ).toBeInTheDocument();
    expect(card.getByText('Se envía siempre; la clienta puede desactivarlo en la app.')).toBeInTheDocument();

    const pushSwitch = card.getByRole('switch', { name: 'Push' });
    expect(pushSwitch).toBeChecked();
    expect(pushSwitch).toBeDisabled();
    await user.click(pushSwitch);
    expect(api.calls).toEqual([]);
  });

  it('saves reminder minutes inside the range and keeps the field when they are not', async () => {
    const api = notificationsApi([reminderPush()]);
    server.use(...api.handlers, ...liveBusiness().handlers);
    app = renderApp('/business?tab=notifications');
    const user = userEvent.setup();

    const minutes = await screen.findByRole('textbox', { name: /Min\. antes/ });
    expect(minutes).toHaveValue('60');
    expect(
      screen.getByText('Entre 5 y 1440 minutos. El cambio se aplica en el minuto siguiente.'),
    ).toBeInTheDocument();

    await user.clear(minutes);
    await user.type(minutes, '4');
    await user.tab();
    expect(screen.getByText('Escribe un número entre 5 y 1440.')).toBeInTheDocument();
    expect(minutes).toHaveValue('60');
    expect(api.calls).toEqual([]);

    await user.clear(minutes);
    await user.type(minutes, '120');
    await user.tab();
    await waitFor(() => {
      expect(api.calls).toEqual([{ id: 'n-push', body: { isEnabled: true, sendBeforeMinutes: 120 } }]);
    });
    expect(minutes).toHaveValue('120');
  });

  it('sends the chosen reminder email time', async () => {
    const api = notificationsApi([reminderEmail()]);
    server.use(...api.handlers, ...liveBusiness().handlers);
    app = renderApp('/business?tab=notifications');
    const user = userEvent.setup();

    expect(
      await screen.findByText(
        'Se envía el día de la cita a la hora elegida. Las citas que empiecen antes de esa hora, o que se reserven o se muevan ese mismo día, no lo reciben.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Hora de envío' }));
    await user.click(await screen.findByRole('option', { name: '09:30' }));

    await waitFor(() => {
      expect(api.calls).toEqual([{ id: 'n-email', body: { isEnabled: false, sendAtLocalTime: '09:30' } }]);
    });
    expect(screen.getByRole('combobox', { name: 'Hora de envío' })).toHaveTextContent('09:30');
  });

  it('puts the switch back when the save is rejected', async () => {
    const api = notificationsApi([reminderPush()], 400);
    server.use(...api.handlers, ...liveBusiness().handlers);
    app = renderApp('/business?tab=notifications');
    const user = userEvent.setup();

    const pushSwitch = await screen.findByRole('switch', { name: 'Push' });
    expect(pushSwitch).toBeChecked();
    await user.click(pushSwitch);

    expect(
      await screen.findByText(
        'No se ha podido actualizar la notificación. El servidor ha rechazado los datos: minutes out of range',
      ),
    ).toBeInTheDocument();
    expect(pushSwitch).toBeChecked();
  });
});
