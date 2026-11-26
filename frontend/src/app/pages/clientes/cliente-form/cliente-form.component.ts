import { TecladoNumericoDirective } from '#shared-frontend/directives/teclado-numerico.directive';
import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ClienteService } from '#core/services/cliente.service';
import { ToastService } from '#shared-frontend/services/toast.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    TecladoNumericoDirective,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    NgxMaskDirective,
    EnterFocusNextDirective,
    DialogWrapper,
  ],
  providers: [provideNgxMask()],
  templateUrl: './cliente-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./cliente-form.component.css'],
})
export class ClienteForm {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  buscandoCpfCnpj = false;
  clienteId?: number;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private readonly toast: ToastService,
  ) {
    this.form = this.fb.group({
      razao_social: ['', [Validators.required, Validators.maxLength(200)]],
      nome_fantasia: ['', [Validators.maxLength(200)]],
      cpf_cnpj: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      telefone: ['', [Validators.maxLength(20)]],
      cep: ['', [Validators.required]],
      endereco: ['', [Validators.required, Validators.maxLength(200)]],
      numero: ['', [Validators.required, Validators.maxLength(10)]],
      bairro: ['', [Validators.required, Validators.maxLength(100)]],
      complemento: ['', [Validators.maxLength(100)]],
      cod_cidade: [null, [Validators.required]],
      cidade_nome: [{ value: '', disabled: true }],
      observacoes: [''],
    });
  }

  abrir(id?: number) {
    this.clienteId = id;
    this.visible = true;
    this.form.reset();

    if (id) {
      this.isLoadingData = true;
      this.clienteService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res.data,
            cidade_nome: res.data.cidade?.descricao,
          });
          this.isLoadingData = false;
        },
        error: () => {
          this.toast.error('Falha ao buscar dados do cliente');
          this.visible = false;
        },
      });
    }
  }

  onBuscarCpfCnpj() {
    const cpfCnpj = this.form.get('cpf_cnpj')?.value?.replace(/\D/g, '');
    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      this.toast.warn('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) completo.');
      return;
    }
    this.buscandoCpfCnpj = true;
    this.clienteService.consultarReceita(cpfCnpj).subscribe({
      next: (res) => {
        this.form.patchValue(res.data);
        this.toast.success('Dados preenchidos automaticamente.', 'Receita Federal');
        this.buscandoCpfCnpj = false;
      },
      error: (err) => {
        const detail = err?.error?.message ?? 'Não foi possível consultar o CPF/CNPJ.';
        this.toast.warn(detail, 'Receita Federal');
        this.buscandoCpfCnpj = false;
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
              endereco: res.data.logradouro,
              bairro: res.data.bairro,
              complemento: res.data.complemento,
              cod_cidade: res.data.cidade.id,
              cidade_nome: res.data.cidade.descricao,
            });
            this.toast.info('Endereço e Cidade preenchidos automaticamente', 'CEP Localizado');
          }
        },
        error: () => {
          this.toast.warn('Falha ao localizar CEP. Preencha manualmente', 'CEP');
        },
      });
    }
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.warn('Preencha todos os campos obrigatórios.');
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.getRawValue(), id: this.clienteId };

    this.clienteService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Cliente ${this.clienteId ? 'atualizado' : 'criado'} com sucesso`);
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.toast.error('Falha ao salvar cliente');
        this.isSaving = false;
      },
    });
  }
}
