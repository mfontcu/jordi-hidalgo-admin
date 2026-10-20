import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { instantAt } from '@/shared/lib/business-time';
import { testSession as session } from '@/test/session';
import { meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import {
  appointmentCreate,
  appointmentDetail,
  appointmentDto,
  availableDates,
  availableSlots,
} from '@/test/msw/appointments';
import { server } from '@/test/msw/server';
import { listResponse, serviceDto, servicesList } from '@/test/msw/services';
import { clientDto, usersList, usersListResponse } from '@/test/msw/users';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(
    meAs(STAFF_USER),
    servicesList((query) => {
      const status = query.get('status');
      const items = status === 'active' ? [serviceDto()] : listResponse().items;
      return listResponse(items);
    }).handler,
    availableDates(),
    availableSlots(),
  );
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

describe('appointment form', () => {
  it('reads the client from the URL, posts the create body, and opens the detail', async () => {
    const create = appointmentCreate(() => appointmentDto({ id: 'apt-new' }));
    server.use(create.handler, appointmentDetail(appointmentDto({ id: 'apt-new' })));
    app = renderApp('/appointments/form?clientId=cli-1&clientLabel=Mari');
    const user = userEvent.setup();

    expect(await screen.findByLabelText('Cliente o administrador (opcional)')).toHaveValue('Mari');

    await user.click(screen.getByLabelText('Servicio'));
    await user.click(await screen.findByRole('button', { name: 'Corte de Pelo' }));
    await user.click(await screen.findByRole('button', { name: '10:30' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cita' }));

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/apt-new');
    });
    expect(create.bodies).toEqual([
      {
        userId: 'cli-1',
        serviceId: 'svc-1',
        appointmentStart: instantAt('2026-10-12', '10:30'),
        status: 'confirmed',
        customerNotes: '',
        internalNotes: '',
      },
    ]);
  });

  it('lists each client with phone and email so matching names stay distinct', async () => {
    const users = usersList((query) => {
      if (query.get('role') !== 'customer') return usersListResponse([]);
      return usersListResponse([
        clientDto({
          id: 'cli-1',
          adminAlias: '',
          firstName: 'Ana',
          lastName: 'García',
          phone: '+34600111222',
          email: 'ana.one@example.com',
        }),
        clientDto({
          id: 'cli-2',
          adminAlias: '',
          firstName: 'Ana',
          lastName: 'García',
          phone: '+34600111222',
          email: 'ana.two@example.com',
        }),
      ]);
    });
    server.use(users.handler);
    app = renderApp('/appointments/form');
    const user = userEvent.setup();

    await user.click(await screen.findByLabelText('Cliente o administrador (opcional)'));

    expect(await screen.findByText('+34600111222 · ana.one@example.com')).toBeInTheDocument();
    expect(screen.getByText('+34600111222 · ana.two@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Ana García')).toHaveLength(2);
  });
});
