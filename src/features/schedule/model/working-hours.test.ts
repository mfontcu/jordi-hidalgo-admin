import {
  endAfterStartChange,
  shiftDeleteOf,
  shiftSaveOf,
  shiftsOf,
  validateShift,
  type WorkingDay,
} from './working-hours';

const tuesday: WorkingDay = {
  weekday: 2,
  label: 'Martes',
  isActive: true,
  morning: { id: 'm', start: '09:00', end: '13:00' },
  afternoon: { id: 'a', start: '16:00', end: '20:00' },
};

describe('working hours', () => {
  it('takes the earliest slot as the morning shift', () => {
    const { morning, afternoon } = shiftsOf([
      { id: 'a', start: '16:00', end: '20:00' },
      { id: 'm', start: '09:00', end: '13:00' },
    ]);
    expect(morning?.id).toBe('m');
    expect(afternoon?.id).toBe('a');
    expect(shiftsOf([])).toEqual({ morning: null, afternoon: null });
  });

  it('updates the shift a day has and creates the one it has not', () => {
    expect(shiftSaveOf(tuesday, 'morning', '08:00', '12:00')).toEqual({
      kind: 'update',
      slotId: 'm',
      start: '08:00',
      end: '12:00',
    });
    expect(shiftSaveOf({ ...tuesday, afternoon: null }, 'afternoon', '15:00', '19:00')).toEqual({
      kind: 'create',
      weekday: 2,
      start: '15:00',
      end: '19:00',
    });
    expect(shiftDeleteOf(tuesday, 'afternoon')).toEqual({ kind: 'delete', slotId: 'a' });
    expect(shiftDeleteOf({ ...tuesday, afternoon: null }, 'afternoon')).toBeNull();
  });

  it('moves an end that no longer follows the start half an hour after it', () => {
    expect(endAfterStartChange('10:00', '09:00')).toBe('10:30');
    expect(endAfterStartChange('10:00', null)).toBe('10:30');
    expect(endAfterStartChange('10:00', '12:00')).toBe('12:00');
    expect(endAfterStartChange('23:50', '23:00')).toBe('23:59');
  });

  it('asks for both times and an end after the start', () => {
    expect(validateShift(tuesday, 'morning', null, null)).toEqual({ start: 'required', end: 'required' });
    expect(validateShift(tuesday, 'morning', '10:00', '10:00')).toEqual({ end: 'endAfterStart' });
    expect(validateShift(tuesday, 'morning', '08:00', '12:00')).toEqual({});
  });

  it('refuses a shift that runs into the other one', () => {
    expect(validateShift(tuesday, 'morning', '09:00', '16:30')).toEqual({
      end: 'overlap',
      overlapping: tuesday.afternoon,
    });
    expect(validateShift(tuesday, 'afternoon', '12:30', '20:00')).toEqual({
      start: 'overlap',
      overlapping: tuesday.morning,
    });
    // Touching is not overlapping.
    expect(validateShift(tuesday, 'morning', '09:00', '16:00')).toEqual({});
    expect(validateShift({ ...tuesday, afternoon: null }, 'morning', '09:00', '21:00')).toEqual({});
  });
});
