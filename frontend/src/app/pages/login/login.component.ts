import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '#core/services/auth.service';
import { ThemeService } from '#core/services/theme.service';
import { ToastService } from '#shared-frontend/services/toast.service';
import { Botao, Dica, CampoSenha, MenuFlutuante, IMenuItem } from '#ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    Botao,
    Dica,
    CampoSenha,
    MenuFlutuante,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./login.component.css'],
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  currentYear = new Date().getFullYear();

  colorMenuItems: IMenuItem[] = [
    {
      label: 'Laranja (Sakai)',
      icon: 'ic ic-circle-fill text-orange-500',
      command: () => this.themeService.setColor('orange'),
    },
    {
      label: 'Azul',
      icon: 'ic ic-circle-fill text-blue-500',
      command: () => this.themeService.setColor('blue'),
    },
    {
      label: 'Esmeralda',
      icon: 'ic ic-circle-fill text-emerald-500',
      command: () => this.themeService.setColor('emerald'),
    },
    {
      label: 'Índigo',
      icon: 'ic ic-circle-fill text-indigo-500',
      command: () => this.themeService.setColor('indigo'),
    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private readonly toast: ToastService,
    public themeService: ThemeService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
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
          this.toast.error(res.message || 'Credenciais inválidas');
        }
        this.isLoading = false;
      },
      error: (err) => {
        const detail = err?.error?.message || 'Erro ao conectar ao servidor';
        this.toast.error(detail);
        this.isLoading = false;
      },
    });
  }
}
