import { DayOfWeek, Task } from './models/task.models';

export const WEEK_DAYS: ReadonlyArray<{ value: DayOfWeek; short: string; label: string }> = [
    { value: 'MONDAY', short: 'L', label: 'Lunes' },
    { value: 'TUESDAY', short: 'M', label: 'Martes' },
    { value: 'WEDNESDAY', short: 'X', label: 'Miércoles' },
    { value: 'THURSDAY', short: 'J', label: 'Jueves' },
    { value: 'FRIDAY', short: 'V', label: 'Viernes' },
    { value: 'SATURDAY', short: 'S', label: 'Sábado' },
    { value: 'SUNDAY', short: 'D', label: 'Domingo' }
];

export function localDate(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
}

export function addDays(value: string, amount: number): string {
    const date = parseLocalDate(value);
    date.setDate(date.getDate() + amount);
    return localDate(date);
}

export function occursOn(task: Task, date: string): boolean {
    if (task.excludedDates?.includes(date)) return false;
    const weekday = WEEK_DAYS[(parseLocalDate(date).getDay() + 6) % 7].value;
    return task.taskDate === date || !!task.repeatDays?.includes(weekday);
}

export function dateLabel(date: string): string {
    return parseLocalDate(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
