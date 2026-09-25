import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
    let client: HttpClient; let http: HttpTestingController; let tokens: TokenService; let navigate: jasmine.Spy;
    const url = `${environment.apiUrl}/tasks`;
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])] });
        client = TestBed.inject(HttpClient); http = TestBed.inject(HttpTestingController); tokens = TestBed.inject(TokenService);
        tokens.setTokens('old', 'refresh'); navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    });
    afterEach(() => { http.verify(); tokens.clearTokens(); });
    it('refreshes once for concurrent 401s and retries each request with the new JWT', () => {
        client.get(url).subscribe(); client.get(url).subscribe();
        const requests = http.match(url);
        requests.forEach(req => { expect(req.request.headers.get('Authorization')).toBe('Bearer old'); req.flush({}, { status: 401, statusText: 'Unauthorized' }); });
        http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({ token: 'new', refreshToken: 'refresh' });
        const retries = http.match(url); expect(retries.length).toBe(2);
        retries.forEach(req => { expect(req.request.headers.get('Authorization')).toBe('Bearer new'); req.flush([]); });
    });
    it('ends the session when refresh fails, without looping', () => {
        client.get(url).subscribe({ error: () => {} });
        http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
        http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({}, { status: 400, statusText: 'Expired' });
        expect(tokens.isAuthenticated()).toBeFalse(); expect(navigate).toHaveBeenCalled();
    });
    it('does not end a renewed session if the retried operation fails with 500', () => {
        client.get(url).subscribe({ error: () => {} });
        http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
        http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({ token: 'new', refreshToken: 'refresh' });
        http.expectOne(url).flush({}, { status: 500, statusText: 'Error' });
        expect(tokens.getAccessToken()).toBe('new'); expect(navigate).not.toHaveBeenCalled();
    });
    it('does not refresh a second time when the retry returns 401', () => {
        client.get(url).subscribe({ error: () => {} });
        http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
        http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({ token: 'new', refreshToken: 'refresh' });
        http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
        expect(tokens.isAuthenticated()).toBeFalse(); expect(navigate).toHaveBeenCalled();
    });
    it('never attaches JWTs or attempts refresh for auth endpoints or third-party requests', () => {
        for (const endpoint of ['login', 'register', 'refresh', 'logout']) {
            const authUrl = `${environment.apiUrl}/auth/${endpoint}`;
            client.post(authUrl, {}).subscribe({ error: () => {} });
            const req = http.expectOne(authUrl); expect(req.request.headers.has('Authorization')).toBeFalse();
            req.flush({}, { status: 401, statusText: 'Unauthorized' });
        }
        client.get('https://example.org/data').subscribe();
        const external = http.expectOne('https://example.org/data'); expect(external.request.headers.has('Authorization')).toBeFalse(); external.flush({});
        expect(navigate).not.toHaveBeenCalled();
    });
});
