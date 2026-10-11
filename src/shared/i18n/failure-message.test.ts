import { failureMessage } from './failure-message';

describe('failureMessage', () => {
  it.each([
    [{ kind: 'network', message: '' }, 'adminErrorNetwork'],
    [{ kind: 'server', status: 500, message: 'internal error' }, 'adminErrorServer'],
    [{ kind: 'server', status: 503, message: 'unavailable' }, 'adminErrorServiceUnavailable'],
    [{ kind: 'rateLimited', status: 429, message: 'too many requests' }, 'adminErrorRateLimited'],
    [{ kind: 'validation', status: 400, message: '' }, 'adminErrorValidation'],
    [{ kind: 'conflict', status: 409, message: 'conflict' }, 'adminErrorConflict'],
    [{ kind: 'notFound', status: 404, message: 'service not found' }, 'adminErrorNotFound'],
    [{ kind: 'forbidden', status: 403, message: 'forbidden' }, 'adminErrorForbidden'],
    [{ kind: 'unauthorized', status: 401, message: 'unauthorized' }, 'adminErrorUnknown'],
    [{ kind: 'unknown', message: '' }, 'adminErrorUnknown'],
  ] as const)('maps %o to %s', (failure, id) => {
    expect(failureMessage(failure).id).toBe(id);
  });

  it('shows the text of a rejected request', () => {
    expect(failureMessage({ kind: 'validation', status: 400, message: 'displayOrder must be >= 0' })).toEqual(
      {
        id: 'adminErrorValidationDetail',
        values: { detail: 'displayOrder must be >= 0' },
      },
    );
  });
});
