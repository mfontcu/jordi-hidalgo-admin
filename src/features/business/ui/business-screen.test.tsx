import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { liveBusiness } from '@/test/msw/business';
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

const search = () => app?.router.state.location.search;

describe('business screen', () => {
  it('switches tabs in the URL with replace', async () => {
    server.use(...liveBusiness().handlers);
    app = renderApp('/business');
    const user = userEvent.setup();

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(search()).toEqual({});

    await user.click(screen.getByRole('tab', { name: /Reservas/ }));
    await waitFor(() => {
      expect(search()).toEqual({ tab: 'booking' });
    });
    expect(await screen.findByText('Configuración de reservas')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Información/ }));
    await waitFor(() => {
      expect(search()).toEqual({});
    });
  });

  it('saves business info from the info tab', async () => {
    const live = liveBusiness();
    server.use(...live.handlers);
    app = renderApp('/business');
    const user = userEvent.setup();

    const email = await screen.findByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'nuevo@hidalgojunior.com');
    await user.click(screen.getByRole('button', { name: 'Guardar información' }));

    await waitFor(() => {
      const saved = live.calls.find((call) => call.method === 'PUT' && call.path === 'business/info');
      expect(saved).toBeDefined();
      expect(saved?.body).toMatchObject({ email: 'nuevo@hidalgojunior.com' });
    });
    expect(await screen.findByText('Información del negocio actualizada.')).toBeInTheDocument();
  });

  it('keeps the selected legal document in the URL', async () => {
    server.use(...liveBusiness().handlers);
    app = renderApp('/business?tab=legal');

    expect(await screen.findByDisplayValue('Privacidad')).toBeInTheDocument();
    await waitFor(() => {
      expect(search()).toEqual({ tab: 'legal', doc: 'privacy_policy' });
    });
  });
});
