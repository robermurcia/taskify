import { Component, inject } from '@angular/core';
import { DemoStartupService } from './core/startup/demo-startup.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly startup = inject(DemoStartupService);
  constructor() { this.startup.start(); }
}
