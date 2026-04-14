import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ThemeService } from '#core/services/theme.service';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';

function senhasIguaisValidator(g: AbstractControl) {
  const nova = g.get('nova_senha')?.value;
  const confirmar = g.get('confirmar_senha')?.value;
  return nova && confirmar && nova !== confirmar ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    PasswordModule,
    ToastModule,
  ],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.scss'],
})
export class RedefinirSenhaComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  concluido = false;
  tokenInvalido = false;
  token = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private messageService: MessageService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenInvalido = true;
    }

    this.form = this.fb.group({
      nova_senha:      ['', [Validators.required, Validators.minLength(8)]],
      confirmar_senha: ['', [Validators.required]],
    }, { validators: senhasIguaisValidator });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading = true;
    const payload = { token: this.token, nova_senha: this.form.get('nova_senha')!.value };

    this.http.post<TApiResponse<null>>(`${environment.apiUrl}/auth/redefinir-senha`, payload).subscribe({
      next: () => {
        this.concluido = true;
        this.isLoading = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Token inválido ou expirado.';
        if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('expirado')) {
          this.tokenInvalido = true;
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        }
        this.isLoading = false;
      },
    });
  }
}
