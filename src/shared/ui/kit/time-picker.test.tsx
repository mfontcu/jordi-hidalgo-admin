import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setViewport } from '@/test/match-media';
import { renderWithProviders } from '@/test/render';

import type { CalendarLocale } from '../primitives/calendar';
import { TooltipProvider } from '../primitives/tooltip';
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
  // The panel's shell provides the tooltips of the entry-mode button.
  renderWithProviders(
    <TooltipProvider>
      <TimePickerField
        id="start"
        label="Start"
        value={value}
        onChange={onChange}
        initialTime="09:05"
        language={language}
        labels={labels}
      />
    </TooltipProvider>,
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

  it('opens in input mode with a mouse, and confirms the typed time', async () => {
    const onChange = renderField('es');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog', { name: 'Select the start time' });
    // Spanish hours carry no leading zero (H:mm).
    expect(within(dialog).getByLabelText('Hour')).toHaveValue('9');
    expect(within(dialog).getByLabelText('Minute')).toHaveValue('05');
    await user.clear(within(dialog).getByLabelText('Hour'));
    await user.type(within(dialog).getByLabelText('Hour'), '17');
    await user.clear(within(dialog).getByLabelText('Minute'));
    await user.type(within(dialog).getByLabelText('Minute'), '30{Enter}');

    expect(onChange).toHaveBeenCalledWith('17:30');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refuses a time out of range and keeps the dialog open', async () => {
    const onChange = renderField('ca');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    // Catalan hours are two digits (HH:mm).
    expect(within(dialog).getByLabelText('Hour')).toHaveValue('09');
    await user.clear(within(dialog).getByLabelText('Hour'));
    await user.type(within(dialog).getByLabelText('Hour'), '24');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));

    expect(within(dialog).getByText('Enter a valid time')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Hour')).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens on the dial with touch, moves to the minutes, and steps with the keyboard', async () => {
    setViewport({ finePointer: false, width: 390, height: 844 });
    const onChange = renderField('es', '14:20');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    const dial = within(dialog).getByRole('slider', { name: 'Hour' });
    expect(dial).toHaveAttribute('aria-valuenow', '14');
    fireEvent.keyDown(dial, { key: 'ArrowUp' });
    expect(within(dialog).getByRole('button', { name: 'Hour 15' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(dialog).getByRole('button', { name: 'Minute 20' }));
    const minutes = within(dialog).getByRole('slider', { name: 'Minute' });
    fireEvent.keyDown(minutes, { key: 'ArrowDown' });
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));

    expect(onChange).toHaveBeenCalledWith('15:19');
  });

  it('keeps the typed time when switching to the dial', async () => {
    const onChange = renderField('es');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    await user.clear(within(dialog).getByLabelText('Hour'));
    await user.type(within(dialog).getByLabelText('Hour'), '8');
    await user.click(within(dialog).getByRole('button', { name: 'Switch to dial picker mode' }));

    expect(within(dialog).getByRole('slider', { name: 'Hour' })).toHaveAttribute('aria-valuenow', '8');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses a 12-hour clock with AM and PM in English', async () => {
    const onChange = renderField('en', '09:15');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'PM' }));
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(onChange).toHaveBeenCalledWith('21:15');

    // An hour past twelve is refused in a 12-hour field.
    await user.click(screen.getByRole('button', { name: 'Start' }));
    const again = await screen.findByRole('dialog');
    await user.clear(within(again).getByLabelText('Hour'));
    await user.type(within(again).getByLabelText('Hour'), '13');
    await user.click(within(again).getByRole('button', { name: 'OK' }));
    expect(within(again).getByText('Enter a valid time')).toBeInTheDocument();
  });
});
