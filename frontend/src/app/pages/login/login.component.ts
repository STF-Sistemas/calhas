import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '#core/services/auth.service';
import { ThemeService } from '#core/services/theme.service';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    ToastModule,
    CheckboxModule,
    TooltipModule,
    MenuModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  currentYear = new Date().getFullYear();

  colorMenuItems: MenuItem[] = [
    { label: 'Laranja (Sakai)', icon: 'pi pi-circle-fill text-orange-500', command: () => this.themeService.setColor('orange') },
    { label: 'Azul', icon: 'pi pi-circle-fill text-blue-500', command: () => this.themeService.setColor('blue') },
    { label: 'Esmeralda', icon: 'pi pi-circle-fill text-emerald-500', command: () => this.themeService.setColor('emerald') },
    { label: 'Índigo', icon: 'pi pi-circle-fill text-indigo-500', command: () => this.themeService.setColor('indigo') }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    public themeService: ThemeService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/']);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: res.message || 'Credenciais inválidas' });
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao conectar ao servidor' });
        this.isLoading = false;
      }
    });
  }
}
