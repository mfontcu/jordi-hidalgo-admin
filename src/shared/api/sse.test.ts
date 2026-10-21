import { consumeSse } from './sse';

describe('consumeSse', () => {
  it('splits events and keeps a partial chunk', () => {
    const first = consumeSse('id: 4\nevent: activity\ndata: {"id":4}\n\n: ping\n\nid: 5\nevent: res');
    expect(first.messages).toEqual([{ id: '4', event: 'activity', data: '{"id":4}' }]);
    expect(first.rest).toBe('id: 5\nevent: res');

    const second = consumeSse(`${first.rest}et\ndata: {"id":5}\n\n`);
    expect(second.messages).toEqual([{ id: '5', event: 'reset', data: '{"id":5}' }]);
    expect(second.rest).toBe('');
  });

  it('joins data lines and ignores comments', () => {
    const { messages } = consumeSse(': ping\n\ndata: one\ndata: two\n\n');
    expect(messages).toEqual([{ data: 'one\ntwo' }]);
  });
});
