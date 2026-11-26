import { TecladoNumericoDirective } from '#shared-frontend/directives/teclado-numerico.directive';
import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { LogoUploader } from '#shared-frontend/components/logo-uploader/logo-uploader.component';
import { EmpresaService } from '#core/services/empresa.service';
import { ClienteService } from '#core/services/cliente.service';
import { AuthService } from '#core/services/auth.service';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { HttpClient } from '@angular/common/http';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { environment } from '#environments/environment';
import { ToastService } from '#shared-frontend/services/toast.service';
import { Botao, Dica, CampoData, CampoNumero, Tag, Abas, ListaAbas, Aba, PaineisAbas, PainelAba } from '#ui';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    TecladoNumericoDirective,
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    CurrencyMaskDirective,
    EnterFocusNextDirective,
    DialogWrapper,
    LogoUploader,
    Botao,
    Dica,
    CampoData,
    CampoNumero,
    Tag,
    Abas,
    ListaAbas,
    Aba,
    PaineisAbas,
    PainelAba,
  ],
  templateUrl: './empresa-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./empresa-form.component.css'],
})
export class EmpresaForm {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  isSavingValidade = false;
  empresaId?: number;

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private clienteService: ClienteService,
    private readonly toast: ToastService,
    private http: HttpClient,
    public authService: AuthService,
  ) {
    this.form = this.fb.group({
      razao_social: ['', [Validators.required, Validators.maxLength(200)]],
      nome_fantasia: ['', [Validators.maxLength(200)]],
      cnpj: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      telefone: ['', [Validators.maxLength(20)]],
      cep: ['', [Validators.required]],
      endereco: ['', [Validators.required, Validators.maxLength(200)]],
      numero: ['', [Validators.required, Validators.maxLength(10)]],
      bairro: ['', [Validators.required, Validators.maxLength(100)]],
      cod_cidade: [null, [Validators.required]],
      cidade_nome: [{ value: '', disabled: true }],
      marca_dagua: ['', [Validators.maxLength(250)]],
      logo_url: [null as string | null],
      validar_estoque: [false],
      quantidade_desenho_por_folha: [
        5,
        [Validators.required, Validators.min(1), Validators.max(20)],
      ],
      whatsapp_mensagem_padrao: [''],
      link_validade_dias: [7, [Validators.min(1), Validators.max(365)]],
      data_expiracao: [null as Date | null],
      valor_mensalidade: [150, [Validators.required, Validators.min(0.01)]],
    });
  }

  get statusLicenca(): 'ativa' | 'expirada' | 'sem-validade' {
    const val = this.form.get('data_expiracao')?.value as Date | null;
    if (!val) return 'sem-validade';
    return new Date(val) > new Date() ? 'ativa' : 'expirada';
  }

  prorrogar30Dias() {
    const atual = this.form.get('data_expiracao')?.value as Date | null;
    const base = atual && new Date(atual) > new Date() ? new Date(atual) : new Date();
    const nova = new Date(base);
    nova.setDate(nova.getDate() + 30);
    this.form.get('data_expiracao')?.setValue(nova);
  }

  salvarValidade() {
    if (!this.empresaId) return;
    this.isSavingValidade = true;
    const val = this.form.get('data_expiracao')?.value as Date | null;
    const valorMensalidade = Number(this.form.get('valor_mensalidade')?.value ?? 150);
    this.http
      .put(`${environment.apiUrl}/empresas/${this.empresaId}/validade`, {
        data_expiracao: val ? val.toISOString() : null,
        valor_mensalidade: valorMensalidade,
      })
      .subscribe({
        next: () => {
          this.toast.success('Licença atualizada.');
          this.isSavingValidade = false;
        },
        error: () => {
          this.toast.error('Falha ao atualizar licença.');
          this.isSavingValidade = false;
        },
      });
  }

  abrir(id?: number) {
    this.empresaId = id;
    this.visible = true;
    this.form.reset();

    if (id) {
      this.isLoadingData = true;
      this.empresaService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res.data,
            cidade_nome: res.data.cidade?.descricao,
            data_expiracao: res.data.data_expiracao ? new Date(res.data.data_expiracao) : null,
            valor_mensalidade: Number(res.data.valor_mensalidade ?? 150),
          });
          this.isLoadingData = false;
        },
        error: () => {
          this.toast.error('Falha ao buscar dados da empresa');
          this.visible = false;
        },
      });
    }
  }

  onCepChange() {
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
            this.toast.info('Endereço e Cidade preenchidos automaticamente', 'CEP Localizado');
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

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving = true;
    const dados = { ...this.form.getRawValue(), id: this.empresaId };

    this.empresaService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Empresa ${this.empresaId ? 'atualizada' : 'criada'} com sucesso`);
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Falha ao salvar empresa');
        this.isSaving = false;
      },
    });
  }
}
