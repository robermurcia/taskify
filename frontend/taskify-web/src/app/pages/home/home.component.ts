import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenService } from '../../core/services/token.service';
import { TaskListComponent } from '../../components/task-list/task-list.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, TaskListComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
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
