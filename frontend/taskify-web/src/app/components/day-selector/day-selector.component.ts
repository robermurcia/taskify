import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { addDays, dateLabel, localDate, parseLocalDate } from '../../core/tasks/task-date';

@Component({
    selector: 'app-day-selector', standalone: true,
    templateUrl: './day-selector.component.html', styleUrl: './day-selector.component.scss'
})
export class DaySelectorComponent implements OnChanges, AfterViewChecked {
    @Input({ required: true }) selected = localDate();
    @Input() counts: Readonly<Record<string, number>> = {};
    @Output() selectDate = new EventEmitter<string>();
    start = localDate();
    days: Array<{ date: string; number: number; weekday: string; label: string }> = [];
    readonly today = localDate();
    @ViewChild('dayStrip') private dayStrip?: ElementRef<HTMLDivElement>;
    private lastVisibleSelection = '';

    ngOnChanges(): void {
        if (this.selected < this.start || this.selected > addDays(this.start, 13)) this.start = this.selected;
        this.buildDays();
    }
    get month(): string {
        const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' });
        const start = formatter.format(parseLocalDate(this.start));
        const end = formatter.format(parseLocalDate(addDays(this.start, 13)));
        return start === end ? start : `${start} — ${end}`;
    }
    ngAfterViewChecked(): void {
        if (this.lastVisibleSelection === this.selected || !this.dayStrip) return;
        const strip = this.dayStrip.nativeElement;
        const selected = strip.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!selected) return;
        strip.scrollLeft += selected.getBoundingClientRect().left - strip.getBoundingClientRect().left
            - (strip.clientWidth - selected.offsetWidth) / 2;
        this.lastVisibleSelection = this.selected;
    }
    move(amount: number): void {
        this.start = addDays(this.start, amount);
        this.selectDate.emit(this.start);
        this.buildDays();
    }
    private buildDays(): void {
        this.days = Array.from({ length: 14 }, (_, i) => {
            const date = addDays(this.start, i);
            return { date, number: parseLocalDate(date).getDate(), label: dateLabel(date),
                weekday: parseLocalDate(date).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '') };
        });
    }
}
