import { session } from './session-store';
import { openActivityStream, readActivityEventStream, type ActivityStreamEvent } from './activity-stream';

const baseUrl = 'http://api.test';

const booked = {
  id: 4,
  kind: 'appointment.booked',
  announce: true,
  payload: { customerName: 'Ana', appointmentPublicId: 'apt-1' },
};

function frame(id: number, event: string, data: unknown) {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

afterEach(() => {
  session.clear();
});

describe('openActivityStream', () => {
  it('sends the bearer and the cursor', async () => {
    session.setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    let authorization: string | null = null;
    let lastEventId: string | null = null;
    const fetchImpl: typeof fetch = (input) => {
      const request = input instanceof Request ? input : new Request(String(input));
      authorization = request.headers.get('Authorization');
      lastEventId = request.headers.get('Last-Event-ID');
      expect(new URL(request.url).searchParams.get('after')).toBe('3');
      return Promise.resolve(
        new Response('', { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      );
    };

    await openActivityStream({ baseUrl, fetchImpl }).open({
      after: 3,
      signal: new AbortController().signal,
      onEvent: () => undefined,
    });

    expect(authorization).toBe('Bearer access-1');
    expect(lastEventId).toBe('3');
  });

  it('treats the opening burst as replay and a later event as live', async () => {
    const encoder = new TextEncoder();
    let push: ((chunk: Uint8Array) => void) | undefined;
    let close: (() => void) | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        push = (chunk) => {
          controller.enqueue(chunk);
        };
        close = () => {
          controller.close();
        };
      },
    });
    const seen: ActivityStreamEvent[] = [];
    const pending = readActivityEventStream(body, new AbortController().signal, (event) => {
      seen.push(event);
    });

    await vi.waitFor(() => {
      expect(push).toBeTypeOf('function');
    });
    push?.(encoder.encode(frame(4, 'activity', booked)));
    await vi.waitFor(() => {
      expect(seen[0]).toMatchObject({ type: 'activity', replay: true, row: { id: 4, announce: true } });
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });
    expect(seen).toContainEqual({ type: 'live' });

    push?.(encoder.encode(frame(5, 'activity', { ...booked, id: 5 })));
    await vi.waitFor(() => {
      expect(seen.filter((event) => event.type === 'activity')).toHaveLength(2);
    });
    expect(seen.filter((event) => event.type === 'activity')[1]).toMatchObject({ replay: false });

    close?.();
    await pending;
  });

  it('refreshes a 401 once and opens again with the new token', async () => {
    session.setTokens({ accessToken: 'access-old', refreshToken: 'refresh-old' });
    const authorizations: (string | null)[] = [];
    const fetchImpl: typeof fetch = (input) => {
      const request = input instanceof Request ? input : new Request(String(input));
      if (request.url.endsWith('/auth/refresh')) {
        return Promise.resolve(Response.json({ accessToken: 'access-new', refreshToken: 'refresh-new' }));
      }
      authorizations.push(request.headers.get('Authorization'));
      if (authorizations.length === 1) return Promise.resolve(new Response('unauthorized', { status: 401 }));
      return Promise.resolve(
        new Response('', { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      );
    };

    await openActivityStream({ baseUrl, fetchImpl }).open({
      after: null,
      signal: new AbortController().signal,
      onEvent: () => undefined,
    });

    expect(authorizations).toEqual(['Bearer access-old', 'Bearer access-new']);
    expect(session.tokens()?.accessToken).toBe('access-new');
  });

  it('closes when the refresh is rejected', async () => {
    session.setTokens({ accessToken: 'access-old', refreshToken: 'refresh-old' });
    const fetchImpl: typeof fetch = (input) => {
      const request = input instanceof Request ? input : new Request(String(input));
      if (request.url.endsWith('/auth/refresh')) {
        return Promise.resolve(new Response('unauthorized', { status: 401 }));
      }
      return Promise.resolve(new Response('unauthorized', { status: 401 }));
    };

    await openActivityStream({ baseUrl, fetchImpl }).open({
      after: null,
      signal: new AbortController().signal,
      onEvent: () => undefined,
    });

    expect(session.hasAccessToken()).toBe(false);
  });

  it.each(['user is blocked\n', 'forbidden'])('expires the session on a 403 %j', async (body) => {
    session.setTokens({ accessToken: 'access-old', refreshToken: 'refresh-old' });
    const fetchImpl: typeof fetch = () => Promise.resolve(new Response(body, { status: 403 }));

    await openActivityStream({ baseUrl, fetchImpl }).open({
      after: null,
      signal: new AbortController().signal,
      onEvent: () => undefined,
    });

    expect(session.hasAccessToken()).toBe(false);
  });
});
