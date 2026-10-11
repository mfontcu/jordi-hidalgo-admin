import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/render';

import { DashboardPlaceholderScreen } from './dashboard-placeholder-screen';

describe('DashboardPlaceholderScreen', () => {
  it.each([
    ['es', 'Panel de administración'],
    ['ca', "Panell d'administració"],
    ['en', 'Admin panel'],
  ] as const)('shows the brand in %s', (locale, subtitle) => {
    renderWithProviders(<DashboardPlaceholderScreen />, { locale });

    expect(screen.getByRole('heading', { name: 'Hidalgo Junior' })).toBeInTheDocument();
    expect(screen.getByText(subtitle)).toBeInTheDocument();
  });
});
