import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../core/tasks/models/task.models';
import { WEEK_DAYS } from '../../core/tasks/task-date';

@Component({ selector: 'app-task-item', standalone: true, templateUrl: './task-item.component.html', styleUrl: './task-item.component.scss' })
export class TaskItemComponent {
    @Input({ required: true }) task!: Task;
    @Input() busy = false;
    @Output() toggle = new EventEmitter<void>();
    @Output() edit = new EventEmitter<void>();
    @Output() remove = new EventEmitter<void>();
    readonly priorityLabels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };
    requestToggle(event: Event): void {
        // The server owns the state. Undo the native toggle while the request is pending.
        (event.target as HTMLInputElement).checked = this.task.completed;
        this.toggle.emit();
    }
    get recurrence(): string {
        return WEEK_DAYS.filter(day => this.task.repeatDays?.includes(day.value)).map(day => day.label).join(', ');
    }
}
