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

const VALORES_PADRAO = {
  validar_estoque: false,
  quantidade_desenho_por_folha: 5,
  link_validade_dias: 7,
  valor_mensalidade: 150,
  data_expiracao: null,
  logo_url: null,
};

const ROTULOS_CAMPOS: Record<string, { rotulo: string; aba: string }> = {
  razao_social: { rotulo: 'Razão Social', aba: '0' },
  cnpj: { rotulo: 'CNPJ', aba: '0' },
  email: { rotulo: 'E-mail', aba: '0' },
  telefone: { rotulo: 'Telefone', aba: '0' },
  cep: { rotulo: 'CEP', aba: '0' },
  endereco: { rotulo: 'Logradouro', aba: '0' },
  numero: { rotulo: 'Número', aba: '0' },
  bairro: { rotulo: 'Bairro', aba: '0' },
  cod_cidade: { rotulo: 'Cidade (informe o CEP)', aba: '0' },
  marca_dagua: { rotulo: "Marca d'água", aba: '1' },
  quantidade_desenho_por_folha: { rotulo: 'Desenhos por Folha', aba: '1' },
  link_validade_dias: { rotulo: 'Validade do link', aba: '1' },
  valor_mensalidade: { rotulo: 'Valor da Mensalidade', aba: '2' },
};

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

  abaAtiva: string | number | undefined = '0';

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
    this.abaAtiva = '0';
    this.form.reset(VALORES_PADRAO);

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
    if (this.form.invalid) {
      const invalidos = Object.keys(this.form.controls).filter((c) => this.form.get(c)?.invalid);
      const campos = invalidos.map((c) => ROTULOS_CAMPOS[c]).filter(Boolean);
      const primeiraAba = campos[0]?.aba;
      if (primeiraAba && (primeiraAba !== '2' || (this.empresaId && this.authService.isSuperAdmin()))) {
        this.abaAtiva = primeiraAba;
      }
      this.toast.warn(
        campos.length ? `Confira: ${campos.map((c) => c.rotulo).join(', ')}.` : 'Confira os campos destacados.',
        'Cadastro incompleto',
      );
      return;
    }

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
