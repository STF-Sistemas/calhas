import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';

function senhasIguaisValidator(g: AbstractControl) {
  const nova = g.get('nova_senha')?.value;
  const confirmar = g.get('confirmar_senha')?.value;
  return nova && confirmar && nova !== confirmar ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-alterar-senha',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    PasswordModule,
    ToastModule,
  ],
  templateUrl: './alterar-senha.component.html',
})
export class AlterarSenhaComponent implements OnInit {
  form!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Alterar Senha — Calhas Pro');

    this.form = this.fb.group({
      senha_atual:    ['', [Validators.required]],
      nova_senha:     ['', [Validators.required, Validators.minLength(8)]],
      confirmar_senha: ['', [Validators.required]],
    }, { validators: senhasIguaisValidator });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const { senha_atual, nova_senha } = this.form.value;

    this.http.put<TApiResponse<null>>(`${environment.apiUrl}/perfil/senha`, { senha_atual, nova_senha }).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: res.message ?? 'Senha alterada com sucesso.' });
        this.form.reset();
        this.isSaving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao alterar senha.' });
        this.isSaving = false;
      },
    });
  }
}
