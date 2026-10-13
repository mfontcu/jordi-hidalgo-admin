import { shellLayoutFor } from './layout';

describe('shellLayoutFor', () => {
  it('cuts the shell at 768 and 1024', () => {
    expect(shellLayoutFor(767)).toBe('mobile');
    expect(shellLayoutFor(768)).toBe('tablet');
    expect(shellLayoutFor(1023)).toBe('tablet');
    expect(shellLayoutFor(1024)).toBe('desktop');
  });
});
