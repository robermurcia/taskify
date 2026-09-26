import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

describe('Demo startup', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppComponent], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting()
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows the explanation, shares one probe and removes the notice when ready', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.startup.start();
    expect(fixture.nativeElement.textContent).toContain('alrededor de un minuto');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
    http.expectOne(`${environment.apiUrl}/health`).flush({ status: 'UP' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('alrededor de un minuto');
    fixture.componentInstance.startup.start();
    http.expectNone(`${environment.apiUrl}/health`);
  });

  it('stops after 90 seconds and retries only when requested', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const pending = http.expectOne(`${environment.apiUrl}/health`);
    tick(90_000);
    fixture.detectChanges();
    expect(pending.cancelled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('No pudimos conectar');
    tick(180_000);
    http.expectNone(`${environment.apiUrl}/health`);
    fixture.nativeElement.querySelector('button').click();
    fixture.componentInstance.startup.start();
    http.expectOne(`${environment.apiUrl}/health`).flush({ status: 'UP' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  }));

  it('offers retry after HTTP errors and invalid responses', () => {
    const fixture = TestBed.createComponent(AppComponent);
    http.expectOne(`${environment.apiUrl}/health`).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.nativeElement.querySelector('button').click();
    http.expectOne(`${environment.apiUrl}/health`).flush({ status: 'DOWN' });
    expect(fixture.componentInstance.startup.state()).toBe('error');
    fixture.componentInstance.startup.start();
    http.expectOne(`${environment.apiUrl}/health`).flush(null);
    expect(fixture.componentInstance.startup.state()).toBe('error');
  });
});
