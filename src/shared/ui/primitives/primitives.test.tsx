import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './button';
import { Calendar } from './calendar';
import { Checkbox } from './checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';
import { Switch } from './switch';
import { showErrorToast, showToast, Toaster } from './toast';

describe('Button', () => {
  it('is a plain button by default and runs its action', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Guardando…</Button>);

    const button = screen.getByRole('button', { name: 'Guardando…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('stays disabled when loading even if disabled is false', () => {
    render(
      <Button loading disabled={false}>
        Guardar
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('renders its child element with the button look', () => {
    render(
      <Button asChild variant="text">
        <a href="/services">Servicios</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Servicios' })).toHaveClass('text-foreground');
  });
});

describe('Checkbox and Switch', () => {
  it('toggles a checkbox through its label', async () => {
    render(
      <>
        <Checkbox id="confirmed" />
        <label htmlFor="confirmed">Confirmada</label>
      </>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Confirmada' });
    await userEvent.click(screen.getByText('Confirmada'));
    expect(checkbox).toBeChecked();
  });

  it('toggles a switch', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Visible en la web" onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Visible en la web' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('draws the adaptive tone on the primary track', () => {
    render(<Switch tone="adaptive" checked aria-label="Activa" />);

    const control = screen.getByRole('switch', { name: 'Activa' });
    expect(control).toHaveAttribute('data-tone', 'adaptive');
    expect(control.querySelector('span')).toHaveClass('group-data-[state=checked]:bg-primary');
    expect(control.innerHTML).not.toContain('switch-adaptive');
  });
});

describe('Dialog', () => {
  it('opens with an accessible title and description', async () => {
    render(
      <Dialog>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Cambios sin guardar</DialogTitle>
          <DialogDescription>Si sales, se perderán.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    const dialog = screen.getByRole('dialog', { name: 'Cambios sin guardar' });
    expect(dialog).toHaveAccessibleDescription('Si sales, se perderán.');
  });
});

describe('Toast', () => {
  it('shows a message and an error message', async () => {
    render(<Toaster />);

    showToast('Estado actualizado correctamente.');
    expect(await screen.findByText('Estado actualizado correctamente.')).toBeInTheDocument();

    showErrorToast('No se pudo actualizar el estado.');
    const error = await screen.findByText('No se pudo actualizar el estado.');
    expect(error.closest('[data-sonner-toast]')).toHaveClass('bg-destructive!');
  });
});

describe('Calendar', () => {
  // DayPicker hides the weekday header row from assistive technology (each day has a full label).
  const weekdays = () =>
    [...screen.getByRole('grid').querySelectorAll('thead th')].map((cell) => cell.textContent);

  it('names the month as Flutter does and starts the week on Monday in Spanish', () => {
    render(<Calendar mode="single" language="es" />);

    expect(screen.getByText(/^[a-z]+ de \d{4}$/)).toBeInTheDocument();
    expect(weekdays()).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
  });

  it('uses the Catalan title and initials of Flutter', () => {
    render(<Calendar mode="range" language="ca" />);

    expect(screen.getByText(/^[a-z]+ del \d{4}$/)).toBeInTheDocument();
    expect(weekdays()).toEqual(['DL.', 'DT.', 'DC.', 'DJ.', 'DV.', 'DS.', 'DG.']);
  });

  it('starts the week on Sunday in English single mode, like CalendarDatePicker', () => {
    render(<Calendar mode="single" language="en" />);
    expect(weekdays()[0]).toBe('S');
    expect(weekdays()[1]).toBe('M');
  });

  it('always starts the range grid on Monday', () => {
    render(<Calendar mode="range" language="en" />);
    expect(weekdays()).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });
});
