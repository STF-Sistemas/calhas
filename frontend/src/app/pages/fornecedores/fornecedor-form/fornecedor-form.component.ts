import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { FornecedorService } from '#core/services/fornecedor.service';
import { ClienteService } from '#core/services/cliente.service';
import { IFornecedor } from '#shared/interfaces';
import { ECrt } from '#shared/enums';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';

@Component({
  selector: 'app-fornecedor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    SelectModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    NgxMaskDirective,
    EnterFocusNextDirective,
    DialogWrapperComponent,
  ],
  providers: [provideNgxMask()],
  templateUrl: './fornecedor-form.component.html',
  styleUrls: ['./fornecedor-form.component.scss'],
})
export class FornecedorFormComponent implements OnInit {
  /** Quando usado como sub-componente de lookup, pré-preenche o CNPJ */
  @Input() cnpjInicial?: string;
  @Output() saved = new EventEmitter<IFornecedor>();

  form!: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  buscandoCnpj = false;
  fornecedorId?: number;

  crtOpcoes = [
    { label: 'Simples Nacional', value: ECrt.SimplesNacional },
    { label: 'Simples Nacional — Excesso', value: ECrt.SimplesNacionalExcesso },
    { label: 'Regime Normal', value: ECrt.RegimeNormal },
  ];

  ufOpcoes = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
  ].map((uf) => ({ label: uf, value: uf }));

  constructor(
    private fb: FormBuilder,
    private fornecedorService: FornecedorService,
    private clienteService: ClienteService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      razao_social: ['', [Validators.required, Validators.maxLength(200)]],
      nome_fantasia: ['', [Validators.maxLength(200)]],
      cnpj: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      ie: ['', [Validators.maxLength(20)]],
      iest: ['', [Validators.maxLength(20)]],
      im: ['', [Validators.maxLength(20)]],
      crt: [ECrt.SimplesNacional, [Validators.required]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      fone: ['', [Validators.maxLength(20)]],
      cep: [''],
      logradouro: ['', [Validators.maxLength(200)]],
      numero: ['', [Validators.maxLength(20)]],
      complemento: ['', [Validators.maxLength(100)]],
      bairro: ['', [Validators.maxLength(100)]],
      cod_cidade: [null as number | null],
      cidade_nome: [{ value: '', disabled: true }],
    });
  }

  abrir(id?: number, cnpj?: string, emitente?: Record<string, unknown>) {
    this.fornecedorId = id;
    this.visible = true;
    this.form.reset({ crt: ECrt.SimplesNacional });

    if (id) {
      this.isLoadingData = true;
      this.fornecedorService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res.data,
            cidade_nome: res.data.cidade ? `${res.data.cidade.descricao}/${res.data.cidade.uf}` : '',
          });
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados do fornecedor' });
          this.visible = false;
        },
      });
      return;
    }

    // Pré-preenche com dados do emitente da NF-e se disponíveis
    if (emitente) {
      this.form.patchValue({
        cnpj: String(emitente['cnpj'] ?? '').replace(/\D/g, ''),
        razao_social: emitente['razao_social'] ?? '',
        nome_fantasia: emitente['nome_fantasia'] ?? '',
        ie: emitente['ie'] ?? '',
        crt: emitente['crt'] ? Number(emitente['crt']) : ECrt.SimplesNacional,
        fone: emitente['fone'] ?? '',
        cep: String(emitente['cep'] ?? '').replace(/\D/g, ''),
        logradouro: emitente['logradouro'] ?? '',
        numero: emitente['numero'] ?? '',
        complemento: emitente['complemento'] ?? '',
        bairro: emitente['bairro'] ?? '',
      });
      const cep = String(emitente['cep'] ?? '').replace(/\D/g, '');
      if (cep.length === 8) {
        this.onCepChange();
      }
      return;
    }

    if (cnpj) {
      this.form.patchValue({ cnpj: cnpj.replace(/\D/g, '') });
    } else if (this.cnpjInicial) {
      this.form.patchValue({ cnpj: this.cnpjInicial.replace(/\D/g, '') });
    }
  }

  onBuscarCnpj() {
    const cnpj = this.form.get('cnpj')?.value?.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe um CNPJ completo (14 dígitos).' });
      return;
    }
    this.buscandoCnpj = true;
    this.clienteService.consultarReceita(cnpj).subscribe({
      next: (res) => {
        const d = res.data;
        this.form.patchValue({
          razao_social: d.razao_social,
          nome_fantasia: d.nome_fantasia,
          email: d.email,
          fone: d.telefone,
          cep: d.cep,
          logradouro: d.endereco,
          numero: d.numero,
          bairro: d.bairro,
          complemento: d.complemento,
          cod_cidade: d.cod_cidade,
          cidade_nome: d.cidade_nome && d.uf ? `${d.cidade_nome}/${d.uf}` : d.cidade_nome,
        });
        this.messageService.add({ severity: 'success', summary: 'Receita Federal', detail: 'Dados preenchidos automaticamente.' });
        this.buscandoCnpj = false;
      },
      error: (err) => {
        const detail = err?.error?.message ?? 'Não foi possível consultar o CNPJ.';
        this.messageService.add({ severity: 'warn', summary: 'Receita Federal', detail });
        this.buscandoCnpj = false;
      },
    });
  }

  onCepChange() {
    const cep = this.form.get('cep')?.value?.replace(/\D/g, '');
    if (cep?.length === 8) {
      this.clienteService.buscarCep(cep).subscribe({
        next: (res) => {
          if (res.success) {
            this.form.patchValue({
              logradouro: res.data.logradouro,
              bairro: res.data.bairro,
              complemento: res.data.complemento,
              cod_cidade: res.data.cidade.id,
              cidade_nome: `${res.data.cidade.descricao}/${res.data.uf}`,
            });
            this.messageService.add({ severity: 'info', summary: 'CEP Localizado', detail: 'Endereço preenchido automaticamente' });
          }
        },
        error: () => {
          this.messageService.add({ severity: 'warn', summary: 'CEP', detail: 'Falha ao localizar CEP. Preencha manualmente.' });
        },
      });
    }
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isSaving = true;
    const raw = this.form.getRawValue();
    // Envia apenas dígitos do CNPJ
    const dados: Partial<IFornecedor> = {
      ...raw,
      cnpj: raw['cnpj'].replace(/\D/g, ''),
      id: this.fornecedorId,
    };
    delete (dados as Record<string, unknown>)['cidade_nome'];

    this.fornecedorService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success', summary: 'Sucesso',
            detail: `Fornecedor ${this.fornecedorId ? 'atualizado' : 'criado'} com sucesso`,
          });
          this.saved.emit(res.data);
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Falha ao salvar fornecedor';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        this.isSaving = false;
      },
    });
  }
}
