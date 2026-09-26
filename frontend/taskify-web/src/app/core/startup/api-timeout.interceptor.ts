import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

// Bound later requests too: a tab may remain open while the server goes back to sleep.
// Never automatically replay writes after a timeout; they may have reached the server.
export const apiTimeoutInterceptor: HttpInterceptorFn = (request, next) =>
  request.url.startsWith(`${environment.apiUrl}/`)
    ? next(request).pipe(timeout(90_000)) : next(request);
