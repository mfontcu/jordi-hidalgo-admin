import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepts an http(s) API base URL and drops trailing slashes', () => {
    expect(parseEnv({ VITE_API_BASE_URL: 'https://api.hidalgojunior.com/' })).toEqual({
      VITE_API_BASE_URL: 'https://api.hidalgojunior.com',
    });
  });

  it.each([undefined, '', 'not a url', 'ftp://api.hidalgojunior.com'])('rejects %j', (value) => {
    expect(() => parseEnv({ VITE_API_BASE_URL: value })).toThrow(/VITE_API_BASE_URL/);
  });
});
