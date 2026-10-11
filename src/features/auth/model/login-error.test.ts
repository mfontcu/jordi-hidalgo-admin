import { loginErrorKey } from './login-error';

describe('loginErrorKey', () => {
  it.each([
    ['invalidCredentials', 'authErrorInvalidCredentials'],
    ['noAdminAccess', 'authErrorNoAdminAccess'],
    ['network', 'authErrorNetwork'],
    ['server', 'authErrorServer'],
    ['failed', 'authErrorLoginFailed'],
    ['unknown', 'authErrorUnknown'],
  ] as const)('shows %s as %s', (failure, key) => {
    expect(loginErrorKey(failure)).toBe(key);
  });
});
