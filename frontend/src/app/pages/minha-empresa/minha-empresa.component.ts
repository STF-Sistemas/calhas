import { TecladoNumericoDirective } from '#shared-frontend/directives/teclado-numerico.directive';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ClienteService } from '#core/services/cliente.service';
import { environment } from '#environments/environment';
import { IEmpresa } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';
import { LogoUploader } from '#shared-frontend/components/logo-uploader/logo-uploader.component';
import { ToastService } from '#shared-frontend/services/toast.service';
import { Botao, Dica, CampoNumero, Cartao, Abas, ListaAbas, Aba, PaineisAbas, PainelAba } from '#ui';

@Component({
  selector: 'app-minha-empresa',
  standalone: true,
  imports: [
    TecladoNumericoDirective,
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    LogoUploader,
    Botao,
    Dica,
    CampoNumero,
    Cartao,
    Abas,
    ListaAbas,
    Aba,
    PaineisAbas,
    PainelAba,
  ],
  providers: [provideNgxMask()],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './minha-empresa.component.html',
})
export class MinhaEmpresa implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private clienteService: ClienteService,
    private readonly toast: ToastService,
    private title: Title,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Minha Empresa | Calhas Pro');

    this.form = this.fb.group({
      razao_social: ['', [Validators.required, Validators.maxLength(200)]],
      nome_fantasia: ['', [Validators.maxLength(200)]],
      cnpj: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      telefone: ['', [Validators.maxLength(20)]],
      cep: [''],
      endereco: ['', [Validators.maxLength(200)]],
      numero: ['', [Validators.maxLength(10)]],
      bairro: ['', [Validators.maxLength(100)]],
      complemento: ['', [Validators.maxLength(100)]],
      cod_cidade: [null as number | null],
      cidade_nome: [{ value: '', disabled: true }],
      marca_dagua: ['', [Validators.maxLength(250)]],
      logo_url: [null as string | null],
      validar_estoque: [false],
      whatsapp_mensagem_padrao: [''],
      link_validade_dias: [7, [Validators.min(1), Validators.max(365)]],
    });

    this.carregar();
  }

  carregar(): void {
    this.isLoading = true;
    this.http.get<TApiResponse<IEmpresa>>(`${environment.apiUrl}/minha-empresa`).subscribe({
      next: (res) => {
        this.form.patchValue({
          ...res.data,
          cidade_nome: res.data.cidade?.descricao ?? '',
        });
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar dados da empresa.');
        this.isLoading = false;
      },
    });
  }

  onCepChange(): void {
    const cep = this.form.get('cep')?.value?.replace(/\D/g, '');
    if (cep?.length === 8) {
      this.clienteService.buscarCep(cep).subscribe({
        next: (res) => {
          if (res.success) {
            this.form.patchValue({
              endereco: res.data.logradouro,
              bairro: res.data.bairro,
              cod_cidade: res.data.cidade.id,
              cidade_nome: res.data.cidade.descricao,
            });
            this.toast.info('Endereço preenchido automaticamente.', 'CEP Localizado');
          }
        },
      });
    }
  }

  inserirTagLink(el: HTMLTextAreaElement): void {
    const ctrl = this.form.get('whatsapp_mensagem_padrao')!;
    const val = ctrl.value ?? '';
    const pos = el.selectionStart ?? val.length;
    ctrl.setValue(val.slice(0, pos) + '{link}' + val.slice(pos));
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = pos + 6;
      el.focus();
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Preencha todos os campos obrigatórios.');
      return;
    }

    this.isSaving = true;
    const raw = this.form.getRawValue();
    const { cidade_nome, ...dados } = raw;

    this.http.put<TApiResponse<IEmpresa>>(`${environment.apiUrl}/minha-empresa`, dados).subscribe({
      next: (res) => {
        this.form.patchValue({
          ...res.data,
          cidade_nome: res.data.cidade?.descricao ?? '',
        });
        this.toast.success('Dados da empresa atualizados com sucesso.');
        this.isSaving = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Falha ao salvar.');
        this.isSaving = false;
      },
    });
  }
}
