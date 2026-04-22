import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ClienteService } from '#core/services/cliente.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
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
    DialogWrapperComponent
  ],
  providers: [provideNgxMask()],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.scss']
})
export class ClienteFormComponent {
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
    private messageService: MessageService
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
      observacoes: ['']
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
            cidade_nome: res.data.cidade?.descricao
          });
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados do cliente' });
          this.visible = false;
        }
      });
    }
  }

  onBuscarCpfCnpj() {
    const cpfCnpj = this.form.get('cpf_cnpj')?.value?.replace(/\D/g, '');
    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) completo.' });
      return;
    }
    this.buscandoCpfCnpj = true;
    this.clienteService.consultarReceita(cpfCnpj).subscribe({
      next: (res) => {
        this.form.patchValue(res.data);
        this.messageService.add({ severity: 'success', summary: 'Receita Federal', detail: 'Dados preenchidos automaticamente.' });
        this.buscandoCpfCnpj = false;
      },
      error: (err) => {
        const detail = err?.error?.message ?? 'Não foi possível consultar o CPF/CNPJ.';
        this.messageService.add({ severity: 'warn', summary: 'Receita Federal', detail });
        this.buscandoCpfCnpj = false;
      }
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
              cidade_nome: res.data.cidade.descricao
            });
            this.messageService.add({ severity: 'info', summary: 'CEP Localizado', detail: 'Endereço e Cidade preenchidos automaticamente' });
          }
        },
        error: () => {
          this.messageService.add({ severity: 'warn', summary: 'CEP', detail: 'Falha ao localizar CEP. Preencha manualmente' });
        }
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
    const dados = { ...this.form.getRawValue(), id: this.clienteId };

    this.clienteService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Cliente ${this.clienteId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar cliente' });
        this.isSaving = false;
      }
    });
  }
}
