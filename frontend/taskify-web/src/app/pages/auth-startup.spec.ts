import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { apiTimeoutInterceptor } from '../core/startup/api-timeout.interceptor';
import { environment } from '../../environments/environment';

describe('Authentication forms during a slow API response', () => {
  for (const component of [LoginComponent, RegisterComponent]) {
    it(`${component.name} explains the wait, prevents duplicate submits and unlocks after timeout`, fakeAsync(() => {
      TestBed.configureTestingModule({ providers: [provideRouter([]),
        provideHttpClient(withInterceptors([apiTimeoutInterceptor])), provideHttpClientTesting()
      ] });
      const fixture = TestBed.createComponent<LoginComponent | RegisterComponent>(component);
      const form = fixture.componentInstance;
      form.form.patchValue({ email: 'demo@example.com', password: 'test-password' });
      if (form instanceof RegisterComponent) form.form.controls.name.setValue('Demo');
      form.onSubmit();
      form.onSubmit();
      fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      const endpoint = form instanceof RegisterComponent ? 'register' : 'login';
      const pending = http.expectOne(`${environment.apiUrl}/auth/${endpoint}`);
      expect(fixture.nativeElement.textContent).toContain('alrededor de un minuto');
      expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
      tick(90_000);
      fixture.detectChanges();
      expect(pending.cancelled).toBeTrue();
      expect(form.loading).toBeFalse();
      expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
      expect(form.form.controls.email.value).toBe('demo@example.com');
      form.onSubmit();
      http.expectOne(`${environment.apiUrl}/auth/${endpoint}`).flush({}, { status: 503, statusText: 'Unavailable' });
      expect(form.loading).toBeFalse();
      http.verify();
    }));
  }
});
