import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { TokenService } from '../../core/services/token.service';
import { TaskListComponent } from '../../components/task-list/task-list.component';

@Component({ selector: 'app-home', standalone: true, imports: [RouterLink, TaskListComponent],
    templateUrl: './home.component.html', styleUrl: './home.component.scss' })
export class HomeComponent {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly tokens = inject(TokenService);
    loggingOut = false;
    get email(): string { return this.tokens.getUserEmail(); }
    onLogout(): void {
        if (this.loggingOut) return;
        this.loggingOut = true;
        let failed = false;
        this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
            this.loggingOut = false;
            void this.router.navigate(['/login'], { queryParams: failed ? { reason: 'logout-failed' } : {} });
        })).subscribe({ error: () => failed = true });
    }
}
