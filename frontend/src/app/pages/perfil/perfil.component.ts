import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';
import { IUsuario } from '#shared/interfaces';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ToastModule,
    AvatarModule,
  ],
  templateUrl: './perfil.component.html',
})
export class PerfilComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  usuario: IUsuario | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Meu Perfil — Calhas Pro');

    this.form = this.fb.group({
      nome:  ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    });

    this.carregar();
  }

  carregar(): void {
    this.isLoading = true;
    this.http.get<TApiResponse<IUsuario>>(`${environment.apiUrl}/perfil`).subscribe({
      next: (res) => {
        this.usuario = res.data;
        this.form.patchValue({ nome: res.data.nome, email: res.data.email });
        this.isLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar perfil.' });
        this.isLoading = false;
      },
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.http.put<TApiResponse<IUsuario>>(`${environment.apiUrl}/perfil`, this.form.value).subscribe({
      next: (res) => {
        this.usuario = res.data;
        this.form.patchValue({ nome: res.data.nome, email: res.data.email });
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso.' });
        this.isSaving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao salvar.' });
        this.isSaving = false;
      },
    });
  }

  get iniciais(): string {
    const nome = this.usuario?.nome || '';
    return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}
