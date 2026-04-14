import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { NgxMaskDirective } from 'ngx-mask';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { EmpresaService } from '#core/services/empresa.service';
import { ClienteService } from '#core/services/cliente.service';
import { AuthService } from '#core/services/auth.service';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    DatePickerModule,
    ButtonModule,
    TooltipModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    Textarea,
    TagModule,
    CheckboxModule,
    InputNumberModule,
    NgxMaskDirective,
    CurrencyMaskDirective,
    DialogWrapperComponent,
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
  isSavingValidade = false;
  empresaId?: number;

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private clienteService: ClienteService, // Usado para buscar CEP (rota compartilhada no backend /cep)
    private messageService: MessageService,
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
      validar_estoque: [false],
      quantidade_desenho_por_folha: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
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
    this.http.put(`${environment.apiUrl}/empresas/${this.empresaId}/validade`, {
      data_expiracao: val ? val.toISOString() : null,
      valor_mensalidade: valorMensalidade,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Licença atualizada.' });
        this.isSavingValidade = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar licença.' });
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
    this.form.markAllAsTouched();
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
