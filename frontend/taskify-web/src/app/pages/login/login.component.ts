import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    form: FormGroup;
    error = '';
    loading = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.loading = true;
        this.error = '';

        this.authService.login(this.form.value).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.error = err.error?.message || 'Error al iniciar sesión';
                this.loading = false;
            }
        });
    }
}
