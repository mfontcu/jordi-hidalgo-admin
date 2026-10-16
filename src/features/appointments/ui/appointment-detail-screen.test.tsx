import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { testSession as session } from '@/test/session';
import { meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import {
  appointmentDetail,
  appointmentDto,
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
});
