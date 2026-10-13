import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { businessToday } from '@/shared/lib/business-time';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { ruleDetail, ruleDto, ruleExceptionDto, ruleExceptions, rulesList } from '@/test/msw/schedule';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';
import { testSession as session } from '@/test/session';

import { exceptionDays } from '../../model/recurring-rule';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER), rulesList().handler);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

const path = () => app?.router.state.location.pathname;

/** `POST` and `PUT /admin/recurring-blocked-slots`, recording the bodies. */
function saveHandlers() {
  const bodies: { method: string; body: Record<string, unknown> }[] = [];
  server.use(
    http.post(`${API}/admin/recurring-blocked-slots`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push({ method: 'POST', body });
      return HttpResponse.json(ruleDto({ ...body, id: 'rule-new' }), { status: 201 });
    }),
    http.put(`${API}/admin/recurring-blocked-slots/rule-1`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push({ method: 'PUT', body });
      return HttpResponse.json(ruleDto(body));
    }),
  );
  return bodies;
}

describe('recurring rule detail', () => {
  it('deactivates the rule by sending it whole with the new status', async () => {
    const bodies = saveHandlers();
    server.use(ruleDetail(), ruleExceptions('rule-1', [ruleExceptionDto()]));
    app = renderApp('/schedule/recurring-blocked-slots/rule-1');
    const user = userEvent.setup();

    expect(await screen.findByText('Descanso fijo de media mañana')).toBeInTheDocument();
    expect(await screen.findByText('Puente')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Desactivar regla' }));

    expect(await screen.findByRole('button', { name: 'Activar regla' })).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        method: 'PUT',
        body: {
          weekday: 2,
          start_time: '11:00',
          end_time: '11:30',
          reason: 'Descanso fijo de media mañana',
          is_active: false,
        },
      },
    ]);
  });

  it('adds an unblock exception on the next occurrence and lists it first', async () => {
    const posted: unknown[] = [];
    server.use(
      ruleDetail(),
      ruleExceptions('rule-1', [ruleExceptionDto()]),
      http.post(`${API}/admin/recurring-blocked-slots/rule-1/exceptions`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        posted.push(body);
        return HttpResponse.json(ruleExceptionDto({ ...body, id: 'exc-new' }), { status: 201 });
      }),
    );
    app = renderApp('/schedule/recurring-blocked-slots/rule-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Añadir excepción' }));
    const sheet = await screen.findByRole('dialog', { name: 'Añadir excepción puntual' });
    await user.type(within(sheet).getByLabelText('Motivo de la excepción'), '  Cliente de tarde  ');
    await user.click(within(sheet).getByRole('button', { name: 'Guardar excepción' }));

    expect(await screen.findByText('Excepción guardada correctamente.')).toBeInTheDocument();
    expect(posted).toEqual([
      { date: exceptionDays(2, businessToday()).initial, action: 'unblock', reason: 'Cliente de tarde' },
    ]);
    const reasons = screen.getAllByText(/Cliente de tarde|Puente/).map((node) => node.textContent);
    expect(reasons[0]).toMatch(/Cliente de tarde/);
  });

  it('reports a failed status change and keeps the rule as it was', async () => {
    server.use(
      ruleDetail(),
      ruleExceptions(),
      http.put(`${API}/admin/recurring-blocked-slots/rule-1`, () => HttpResponse.json({}, { status: 500 })),
    );
    app = renderApp('/schedule/recurring-blocked-slots/rule-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Desactivar regla' }));

    expect(await screen.findByRole('button', { name: 'Desactivar regla' })).toBeEnabled();
    await waitFor(() => {
      expect(document.body).toHaveTextContent(/No se ha podido/);
    });
  });
});

describe('recurring rule form', () => {
  it('creates a rule with an empty reason sent empty, and opens it', async () => {
    const bodies = saveHandlers();
    server.use(ruleDetail(ruleDto({ id: 'rule-new', weekday: 3, reason: '' })), ruleExceptions('rule-new'));
    app = renderApp('/schedule/recurring-blocked-slots/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('radio', { name: 'mié' }));
    const ruleSwitch = screen.getByRole('switch', { name: 'Regla activa' });
    expect(ruleSwitch).toHaveAttribute('data-tone', 'adaptive');
    await user.click(ruleSwitch);
    await user.click(screen.getByRole('button', { name: 'Crear bloqueo recurrente' }));

    await waitFor(() => {
      expect(path()).toBe('/schedule/recurring-blocked-slots/rule-new');
    });
    expect(bodies).toEqual([
      {
        method: 'POST',
        body: { weekday: 3, start_time: '11:00', end_time: '11:30', reason: '', is_active: false },
      },
    ]);
    expect(await screen.findByText('Bloqueo recurrente creado correctamente.')).toBeInTheDocument();
    // An empty reason reads "No reason set" in the detail.
    expect(await screen.findAllByText('Sin motivo definido')).not.toHaveLength(0);
  });

  it('refuses an end before the start under the end field', async () => {
    const bodies = saveHandlers();
    app = renderApp('/schedule/recurring-blocked-slots/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Fin' }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText('Hora');
    await user.clear(input);
    await user.type(input, '10:30');
    await user.click(within(dialog).getByRole('button', { name: 'Seleccionar' }));
    await user.click(screen.getByRole('button', { name: 'Crear bloqueo recurrente' }));

    expect(
      await screen.findByText('La hora de inicio debe ser anterior a la hora de fin.'),
    ).toBeInTheDocument();
    expect(bodies).toEqual([]);
  });

  it('edits a rule and lists its exceptions', async () => {
    const bodies = saveHandlers();
    server.use(ruleDetail(), ruleExceptions('rule-1', [ruleExceptionDto()]));
    app = renderApp('/schedule/recurring-blocked-slots/rule-1/form');
    const user = userEvent.setup();

    expect(await screen.findByText('Puente')).toBeInTheDocument();
    const reason = screen.getByRole('textbox', { name: 'Motivo' });
    await user.clear(reason);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(bodies).toHaveLength(1);
    });
    expect(bodies[0]?.body).toMatchObject({ reason: '', is_active: true });
    expect(await screen.findByText('Bloqueo recurrente actualizado correctamente.')).toBeInTheDocument();
  });
});
