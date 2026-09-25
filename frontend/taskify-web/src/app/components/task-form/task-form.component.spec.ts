import { TestBed } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';

describe('TaskFormComponent', () => {
    it('copies recurrence on edit and validates whitespace and date before saving', () => {
        const component = TestBed.runInInjectionContext(() => new TaskFormComponent());
        const repeatDays: import('../../core/tasks/models/task.models').DayOfWeek[] = ['MONDAY'];
        component.task = { id: '1', title: 'Original', description: 'Details', priority: 'HIGH', completed: true,
            taskDate: '2026-09-24', repeatDays, excludedDates: ['2026-10-01'], createdAt: '', updatedAt: '' };
        component.ngOnInit(); component.toggleDay('FRIDAY'); expect(repeatDays).toEqual(['MONDAY']);
        const save = spyOn(component.save, 'emit'); component.form.controls.title.setValue('   '); component.submit(); expect(save).not.toHaveBeenCalled();
        component.form.controls.title.setValue(' Valid '); component.form.controls.taskDate.setValue(''); component.submit(); expect(save).not.toHaveBeenCalled();
        component.form.controls.taskDate.setValue('2026-09-24'); component.submit();
        expect(save).toHaveBeenCalledWith({ title: 'Valid', description: 'Details', priority: 'HIGH', taskDate: '2026-09-24', repeatDays: ['MONDAY', 'FRIDAY'] });
    });
});
