import { addDays, localDate, occursOn } from './task-date';
import { Task } from './models/task.models';

export const exampleTask: Task = { id: '1', title: 'Revisar proyecto', completed: false, priority: 'MEDIUM',
    taskDate: '2026-09-24', repeatDays: ['THURSDAY'], excludedDates: [], createdAt: '', updatedAt: '' };

describe('Calendar dates and recurrence', () => {
    it('matches an exact date or weekly recurrence without duplicating a task', () => {
        expect([exampleTask].filter(task => occursOn(task, '2026-09-24')).length).toBe(1);
        expect(occursOn(exampleTask, '2026-10-01')).toBeTrue();
        expect(occursOn(exampleTask, '2026-09-25')).toBeFalse();
    });
    it('exclusions override both the exact date and weekly recurrence', () => {
        expect(occursOn({ ...exampleTask, excludedDates: ['2026-09-24'] }, '2026-09-24')).toBeFalse();
    });
    it('uses local calendar dates across DST, leap days and year boundaries', () => {
        expect(localDate(new Date(2026, 8, 24, 0, 10))).toBe('2026-09-24');
        expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
        expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
        expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });
});
