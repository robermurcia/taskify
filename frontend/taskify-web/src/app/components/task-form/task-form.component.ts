import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DayOfWeek, Priority, Task, TaskRequest } from '../../core/tasks/models/task.models';
import { WEEK_DAYS, localDate } from '../../core/tasks/task-date';
import { ModalComponent } from '../modal/modal.component';

@Component({ selector: 'app-task-form', standalone: true, imports: [ReactiveFormsModule, ModalComponent],
    templateUrl: './task-form.component.html', styleUrl: './task-form.component.scss' })
export class TaskFormComponent implements OnInit {
    @Input() task: Task | null = null;
    @Input() selectedDate = localDate();
    @Input() saving = false;
    @Input() error = '';
    @Output() save = new EventEmitter<TaskRequest>();
    @Output() dismiss = new EventEmitter<void>();
    readonly weekdays = WEEK_DAYS;
    readonly form = inject(FormBuilder).nonNullable.group({
        title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
        description: ['', Validators.maxLength(500)],
        priority: ['MEDIUM' as Priority, Validators.required],
        taskDate: [localDate(), Validators.required],
        repeatDays: [[] as DayOfWeek[]]
    });

    ngOnInit(): void {
        this.form.setValue({ title: this.task?.title ?? '', description: this.task?.description ?? '',
            priority: this.task?.priority ?? 'MEDIUM', taskDate: this.task?.taskDate || this.selectedDate,
            repeatDays: [...(this.task?.repeatDays ?? [])] });
    }
    toggleDay(day: DayOfWeek): void {
        const selected = this.form.controls.repeatDays.value;
        this.form.controls.repeatDays.setValue(selected.includes(day) ? selected.filter(value => value !== day) : [...selected, day]);
    }
    submit(): void {
        this.form.markAllAsTouched();
        if (this.saving || this.form.invalid) return;
        const value = this.form.getRawValue();
        this.save.emit({ ...value, title: value.title.trim(), description: value.description.trim() });
    }
}
