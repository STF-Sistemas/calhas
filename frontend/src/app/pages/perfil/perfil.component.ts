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
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';
import { IUsuario } from '#shared/interfaces';
import { PushNotificacaoService } from '#core/services/push-notificacao.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ToastModule,
    AvatarModule,
    ToggleSwitch,
  ],
  templateUrl: './perfil.component.html',
})
export class PerfilComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  usuario: IUsuario | null = null;
  alterandoPush = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private title: Title,
    public pushService: PushNotificacaoService,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Meu Perfil — Calhas Pro');

    this.form = this.fb.group({
      nome:  ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    });

    this.carregar();
    this.pushService.carregarStatus();
  }

  async onTogglePush(ativar: boolean): Promise<void> {
    this.alterandoPush = true;
    try {
      if (ativar) {
        await this.pushService.ativar();
        this.messageService.add({ severity: 'success', summary: 'Notificações ativadas', detail: 'Você receberá notificações push neste dispositivo.' });
      } else {
        await this.pushService.desativar();
        this.messageService.add({ severity: 'info', summary: 'Notificações desativadas', detail: 'Você não receberá mais notificações push neste dispositivo.' });
      }
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível alterar as notificações push. Verifique a permissão do navegador.' });
    } finally {
      this.alterandoPush = false;
    }
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
