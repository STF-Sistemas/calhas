import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { NgxMaskDirective } from 'ngx-mask';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { EmpresaService } from '#core/services/empresa.service';
import { ClienteService } from '#core/services/cliente.service';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    Textarea,
    NgxMaskDirective,
    DialogWrapperComponent
  ],
  templateUrl: './empresa-form.component.html',
  styleUrls: ['./empresa-form.component.scss']
})
export class EmpresaFormComponent {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  empresaId?: number;

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private clienteService: ClienteService, // Usado para buscar CEP (rota compartilhada no backend /cep)
    private messageService: MessageService
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
      marca_dagua: ['', [Validators.maxLength(250)]]
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
             cidade_nome: res.data.cidade?.descricao
          });
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados da empresa' });
          this.visible = false;
        }
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
                    cidade_nome: res.data.cidade.descricao
                });
                this.messageService.add({ severity: 'info', summary: 'CEP Localizado', detail: 'Endereço e Cidade preenchidos automaticamente' });
            }
        }
      });
    }
  }

  onSave() {
    if (this.form.invalid) return;

    this.isSaving = true;
    const dados = { ...this.form.getRawValue(), id: this.empresaId };
    
    this.empresaService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Empresa ${this.empresaId ? 'atualizada' : 'criada'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Falha ao salvar empresa' });
        this.isSaving = false;
      }
    });
  }
}
