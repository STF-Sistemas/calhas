import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '#core/services/theme.service';
import { environment } from '#environments/environment';
import { TApiResponse } from '#shared/types';
import { ToastService } from '#shared-frontend/services/toast.service';
import { Botao } from '#ui';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    Botao,
  ],
  templateUrl: './esqueci-senha.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./esqueci-senha.component.css'],
})
export class EsqueciSenha {
  form: FormGroup;
  isLoading = false;
  enviado = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private readonly toast: ToastService,
    public themeService: ThemeService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.http
      .post<TApiResponse<null>>(`${environment.apiUrl}/auth/esqueci-senha`, this.form.value)
      .subscribe({
        next: () => {
          this.enviado = true;
          this.isLoading = false;
        },
        error: () => {
          this.enviado = true;
          this.isLoading = false;
        },
      });
  }
}
