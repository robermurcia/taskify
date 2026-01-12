import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenService } from '../../core/services/token.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {

    constructor(private tokenService: TokenService) { }

    get isAuthenticated(): boolean {
        return this.tokenService.isAuthenticated();
    }

    onLogout(): void {
        this.tokenService.clearTokens();
        window.location.reload();
    }
}
