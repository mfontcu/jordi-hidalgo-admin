import { loginFormSchema } from './login-form';

const issues = (input: unknown) =>
  loginFormSchema.safeParse(input).error?.issues.map(({ path, message }) => [path.join('.'), message]) ?? [];

// Same rules as the validators in login_form_card.dart.
describe('loginFormSchema', () => {
  it('requires the email and the password', () => {
    expect(issues({ email: '  ', password: '   ' })).toEqual([
      ['email', 'authEmailRequired'],
      ['password', 'authPasswordRequired'],
    ]);
  });

  it('requires an @ in the email', () => {
    expect(issues({ email: 'staff.example.com', password: 'secret' })).toEqual([
      ['email', 'authEmailInvalid'],
    ]);
  });

  it('trims the email and sends the password as typed', () => {
    expect(loginFormSchema.parse({ email: ' staff@example.com ', password: ' secret ' })).toEqual({
      email: 'staff@example.com',
      password: ' secret ',
    });
  });
});
