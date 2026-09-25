import { TestBed } from '@angular/core/testing';
import { DaySelectorComponent } from './day-selector.component';

describe('DaySelectorComponent', () => {
    it('renders 14 local dates, crosses years and brings the selected date into view', () => {
        const fixture = TestBed.createComponent(DaySelectorComponent);
        fixture.componentRef.setInput('selected', '2026-12-31'); fixture.detectChanges();
        expect(fixture.componentInstance.days.length).toBe(14);
        expect(fixture.componentInstance.days[1].date).toBe('2027-01-01');
        const emit = spyOn(fixture.componentInstance.selectDate, 'emit');
        fixture.componentInstance.move(14); expect(emit).toHaveBeenCalledWith('2027-01-14');
        fixture.componentRef.setInput('selected', '2027-01-14'); fixture.detectChanges();
        const selected = (fixture.nativeElement as HTMLElement).querySelector('[aria-pressed="true"]');
        expect(selected?.getAttribute('aria-label')).toContain('14 de enero de 2027');
    });
});
