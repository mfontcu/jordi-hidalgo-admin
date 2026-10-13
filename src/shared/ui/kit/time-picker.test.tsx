import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/render';

import type { CalendarLocale } from '../primitives/calendar';
import { TimePickerField, type TimePickerLabels } from './time-picker';

const labels: TimePickerLabels = {
  help: 'Select the start time',
  cancel: 'Cancel',
  confirm: 'OK',
  hour: 'Hour',
  minute: 'Minute',
  inputMode: 'Switch to text input mode',
  dialMode: 'Switch to dial picker mode',
  invalid: 'Enter a valid time',
  am: 'AM',
  pm: 'PM',
};

function renderField(language: CalendarLocale = 'es', value: string | null = null) {
  const onChange = vi.fn();
  renderWithProviders(
    <TimePickerField
      id="start"
      label="Start"
      value={value}
      onChange={onChange}
      initialTime="09:05"
      language={language}
      labels={labels}
    />,
  );
  return onChange;
}

describe('TimePickerField', () => {
  it('shows "--:--" without a time and is disabled when asked', () => {
    renderWithProviders(
      <TimePickerField
        id="end"
        label="End"
        value={null}
        onChange={() => undefined}
        initialTime="09:00"
        language="es"
        labels={labels}
        enabled={false}
        error="Enter the time"
      />,
    );
    const field = screen.getByRole('button', { name: 'End' });
    expect(field).toHaveTextContent('--:--');
    expect(field).toBeDisabled();
    expect(field).toHaveAccessibleDescription('Enter the time');
  });

  it('opens on the locale time, offers quarter hours, and confirms a typed minute', async () => {
    const onChange = renderField('es');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog', { name: 'Select the start time' });
    const field = within(dialog).getByLabelText('Hour');
    // Spanish hours carry no leading zero (H:mm). The quarters are a shortcut.
    expect(field).toHaveValue('9:05');
    expect(within(dialog).getByRole('button', { name: '9:15' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('slider')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '9:15' }));
    expect(field).toHaveValue('9:15');
    await user.clear(field);
    await user.type(field, '17:07{Enter}');

    expect(onChange).toHaveBeenCalledWith('17:07');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refuses a time out of range and keeps the dialog open', async () => {
    const onChange = renderField('ca');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    const field = within(dialog).getByLabelText('Hour');
    // Catalan hours are two digits (HH:mm).
    expect(field).toHaveValue('09:05');
    expect(within(dialog).getByRole('button', { name: '09:15' })).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, '24:00');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));

    expect(within(dialog).getByText('Enter a valid time')).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not confirm when cancelled', async () => {
    const onChange = renderField('es');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses a 12-hour clock with AM and PM in English', async () => {
    const onChange = renderField('en', '09:15');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    const field = within(dialog).getByLabelText('Hour');
    expect(field).toHaveValue('9:15 AM');
    expect(within(dialog).getByRole('button', { name: '9:00 AM' })).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, '9:07 PM');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(onChange).toHaveBeenCalledWith('21:07');

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const again = await screen.findByRole('dialog');
    const hour = within(again).getByLabelText('Hour');
    await user.clear(hour);
    await user.type(hour, '13:15 PM');
    await user.click(within(again).getByRole('button', { name: 'OK' }));
    expect(within(again).getByText('Enter a valid time')).toBeInTheDocument();
  });
});
