import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ThemeService } from '#core/services/theme.service';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
  ],
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.scss'],
})
export class EsqueciSenhaComponent {
  form: FormGroup;
  isLoading = false;
  enviado = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    public themeService: ThemeService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading = true;
    this.http.post<TApiResponse<null>>(`${environment.apiUrl}/auth/esqueci-senha`, this.form.value).subscribe({
      next: () => {
        this.enviado = true;
        this.isLoading = false;
      },
      error: () => {
        // Mesmo em erro mostra mensagem genérica (não revelamos se email existe)
        this.enviado = true;
        this.isLoading = false;
      },
    });
  }
}
