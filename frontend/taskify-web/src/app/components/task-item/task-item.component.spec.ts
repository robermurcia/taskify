import { TestBed } from '@angular/core/testing';
import { TaskItemComponent } from './task-item.component';

describe('TaskItemComponent', () => {
    it('keeps the checkbox at its saved state until the server confirms a toggle', () => {
        const fixture = TestBed.createComponent(TaskItemComponent);
        fixture.componentRef.setInput('task', { id: '1', title: 'Task', priority: 'LOW', completed: false, repeatDays: [] });
        fixture.detectChanges();
        const emit = spyOn(fixture.componentInstance.toggle, 'emit');
        const checkbox = (fixture.nativeElement as HTMLElement).querySelector('input')!;
        checkbox.click(); fixture.detectChanges();
        expect(emit).toHaveBeenCalledTimes(1); expect(checkbox.checked).toBeFalse();
        fixture.componentRef.setInput('task', { ...fixture.componentInstance.task, completed: true }); fixture.detectChanges();
        expect(checkbox.checked).toBeTrue();
    });
});
