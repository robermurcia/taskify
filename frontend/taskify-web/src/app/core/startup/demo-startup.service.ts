import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DemoStartupService {
  // The public probe must not trigger token refresh or replay authentication.
  private readonly http = new HttpClient(inject(HttpBackend));
  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  start(): void {
    if (this.state() === 'loading' || this.state() === 'ready') return;
    this.state.set('loading');
    this.http.get<{ status: string }>(`${environment.apiUrl}/health`).pipe(
      timeout(90_000)
    ).subscribe({
      next: response => this.state.set(response?.status === 'UP' ? 'ready' : 'error'),
      error: () => this.state.set('error')
    });
  }
}
