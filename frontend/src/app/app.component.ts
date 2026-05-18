import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { InstallPromptComponent } from './shared/components/install-prompt/install-prompt.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, InstallPromptComponent],
  template: `<router-outlet></router-outlet><app-install-prompt></app-install-prompt>`,
  styles: []
})
export class AppComponent {}
