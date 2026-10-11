import { http, HttpResponse } from 'msw';

import { server } from '@/test/msw/server';

import { createApiClient } from './client';

const baseUrl = 'http://api.test';

describe('createApiClient', () => {
  it('sends the chosen locale as Accept-Language on every request', async () => {
    let acceptLanguage: string | null = null;
    server.use(
      http.get(`${baseUrl}/app/version`, ({ request }) => {
        acceptLanguage = request.headers.get('Accept-Language');
        return HttpResponse.json({});
      }),
    );

    const client = createApiClient({ baseUrl, getLocale: () => 'ca' });
    const { response } = await client.GET('/app/version', {
      params: { query: { platform: 'android', buildNumber: 1 } },
    });

    expect(response.status).toBe(200);
    expect(acceptLanguage).toBe('ca');
  });
});
