import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/render';

import { KitScreen } from './kit-screen';

describe('KitScreen', () => {
  it('shows every component in light and dark side by side', () => {
    const { container } = renderWithProviders(<KitScreen mode="both" onModeChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Kit visual' })).toBeInTheDocument();
    expect(container.querySelector('.light')).toBeInTheDocument();
    expect(container.querySelector('.dark')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Botones' })).toHaveLength(2);
  });

  it('shows a single mode and asks to change it', async () => {
    const onModeChange = vi.fn();
    const { container } = renderWithProviders(<KitScreen mode="dark" onModeChange={onModeChange} />);

    expect(container.querySelector('.light')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Botones' })).toHaveLength(1);

    await userEvent.click(screen.getByRole('radio', { name: 'Claro' }));
    expect(onModeChange).toHaveBeenCalledWith('light');
  });
});
