import { failureOf } from './failure';

class FakeApiException extends Error {
  constructor(readonly error: unknown) {
    super('api');
  }
}

describe('failureOf', () => {
  it('reads the class, status, and message of an API error', () => {
    expect(
      failureOf(new FakeApiException({ kind: 'validation', status: 400, message: 'invalid displayOrder' })),
    ).toEqual({ kind: 'validation', status: 400, message: 'invalid displayOrder' });
  });

  it('reads a network error, which has no status', () => {
    expect(failureOf(new FakeApiException({ kind: 'network' }))).toEqual({ kind: 'network', message: '' });
  });

  it.each([
    ['a plain error', new Error('boom')],
    ['an unknown class', new FakeApiException({ kind: 'teapot', status: 418 })],
    ['a missing error', new FakeApiException(null)],
    ['a string', 'boom'],
    ['nothing', undefined],
  ])('reports %s as unknown', (_, error) => {
    expect(failureOf(error)).toEqual({ kind: 'unknown', message: '' });
  });
});
