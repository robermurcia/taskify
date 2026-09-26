import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { finalize, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiTimeoutInterceptor } from './api-timeout.interceptor';

describe('API request deadline', () => {
  it('cancels a hanging write, releases loading and never replays it', fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([apiTimeoutInterceptor])), provideHttpClientTesting()
    ] });
    const http = TestBed.inject(HttpTestingController);
    let loading = true;
    let error: unknown;
    TestBed.inject(HttpClient).post(`${environment.apiUrl}/tasks`, {}).pipe(
      finalize(() => loading = false)
    ).subscribe({ error: e => error = e });
    const pending = http.expectOne(`${environment.apiUrl}/tasks`);
    tick(90_000);
    expect(pending.cancelled).toBeTrue();
    expect(loading).toBeFalse();
    expect(error instanceof TimeoutError).toBeTrue();
    tick(180_000);
    http.verify();
  }));
});
