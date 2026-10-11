import { cn } from './cn';

describe('cn', () => {
  it('keeps a type-scale size next to a text color', () => {
    expect(cn('text-body-md text-on-surface')).toBe('text-body-md text-on-surface');
  });

  it('lets the last of two conflicting utilities win', () => {
    expect(cn('text-body-md', 'text-title-lg')).toBe('text-title-lg');
    expect(cn('bg-surface', 'bg-primary')).toBe('bg-primary');
    expect(cn('rounded-md', 'rounded-pill')).toBe('rounded-pill');
  });

  it('drops falsy values', () => {
    expect(cn('p-4', false, undefined, 'h-control')).toBe('p-4 h-control');
  });
});
