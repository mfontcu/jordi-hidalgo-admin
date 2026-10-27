import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { testSession as session } from '@/test/session';
import { meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import {
  appointmentDetail,
  appointmentDto,
  appointmentStatusChange,
  customerPushMessages,
  customerPushSend,
} from '@/test/msw/appointments';
import { server } from '@/test/msw/server';
import { clientDto, userDetail } from '@/test/msw/users';
import { renderApp } from '@/test/render-app';

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

describe('appointment detail', () => {
  it('shows the client and the service', async () => {
    server.use(appointmentDetail(appointmentDto()), userDetail(clientDto()), customerPushMessages());
    app = renderApp('/appointments/apt-1');

    expect(await screen.findByRole('heading', { name: 'Detalle de cita' })).toBeInTheDocument();
    expect(screen.getByText(/Corte · 12 de octubre de 2026 · 10:00/)).toBeInTheDocument();
    expect(screen.getAllByText('María Pérez').length).toBeGreaterThan(0);
    const serviceHeading = screen.getByRole('heading', { name: 'Servicio' });
    expect(within(serviceHeading.parentElement ?? serviceHeading).getByText('Corte')).toBeInTheDocument();
    expect(screen.getByText('Sin canal')).toBeInTheDocument();
  });

  it('shows the channel the appointment was booked on', async () => {
    server.use(
      appointmentDetail(appointmentDto({ channel: 'mcp' })),
      userDetail(clientDto()),
      customerPushMessages(),
    );
    app = renderApp('/appointments/apt-1');

    expect(await screen.findByText('mcp')).toBeInTheDocument();
    expect(screen.queryByText('Sin canal')).not.toBeInTheDocument();
  });

  it('sends a push after confirming', async () => {
    const push = customerPushSend('apt-1');
    server.use(
      appointmentDetail(appointmentDto()),
      userDetail(clientDto()),
      customerPushMessages(),
      push.handler,
    );
    app = renderApp('/appointments/apt-1');
    const user = userEvent.setup();

    const composer = await screen.findByPlaceholderText('Escribe el mensaje para el cliente…');
    await user.type(composer, '  Te esperamos  ');
    await user.click(screen.getByRole('button', { name: 'Enviar push' }));
    const dialog = await screen.findByRole('dialog', { name: 'Enviar push al cliente' });
    await user.click(within(dialog).getByRole('button', { name: 'Enviar push' }));

    expect(await screen.findByText('Push enviado al cliente.')).toBeInTheDocument();
    expect(push.bodies).toEqual([{ body: 'Te esperamos' }]);
  });

  it('lets staff correct the status of a closed appointment', async () => {
    server.use(
      appointmentDetail(appointmentDto({ status: 'cancelled' })),
      userDetail(clientDto()),
      customerPushMessages(),
    );
    app = renderApp('/appointments/apt-1');
    const user = userEvent.setup();

    expect(
      await screen.findByText('Esta cita está cerrada. Si te equivocaste, puedes corregir su estado.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reprogramar cita' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cambiar estado' }));
    const options = ['Pendiente', 'Confirmada', 'Completada', 'No presentado'];
    for (const name of options) expect(await screen.findByRole('button', { name })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelada' })).not.toBeInTheDocument();
  });

  it('says what takes the slot when a reactivation is refused', async () => {
    const change = appointmentStatusChange('apt-1', 409, {
      error: 'appointment slot unavailable',
      conflict: {
        kind: 'appointment',
        start: '2027-03-10T09:15:00Z',
        end: '2027-03-10T09:45:00Z',
        appointmentId: 'apt-2',
        customerName: 'Luis Pérez',
        serviceName: 'Corte',
      },
    });
    server.use(
      appointmentDetail(
        appointmentDto({
          status: 'cancelled',
          appointmentStart: '2027-03-10T09:00:00Z',
          appointmentEnd: '2027-03-10T09:30:00Z',
        }),
      ),
      userDetail(clientDto()),
      customerPushMessages(),
      change.handler,
    );
    app = renderApp('/appointments/apt-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Cambiar estado' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmada' }));

    expect(
      await screen.findByText(
        'No se pudo confirmar la cita de María Pérez (10 de marzo de 2027 · 10:00–10:30). Ese horario ya lo ocupa la cita de Luis Pérez (Corte, 10:15–10:45). Mueve una de las dos a otra hora.',
      ),
    ).toBeInTheDocument();
    expect(change.bodies).toEqual([
      { status: 'confirmed', internalNotes: 'Pagó por Bizum', cancellationReason: '' },
    ]);
  });
});
