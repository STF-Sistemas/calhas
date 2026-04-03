import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { UsuarioService } from '#core/services/usuario.service';
import { EmpresaService } from '#core/services/empresa.service';
import { IEmpresa } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    CheckboxModule,
    DialogWrapperComponent
  ],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss']
})
export class UsuarioFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  usuarioId?: number;

  empresas: IEmpresa[] = [];
  EStatusGeral = EStatusGeral;
  statusOpcoes = [
    { label: 'Ativo', value: EStatusGeral.Ativo },
    { label: 'Inativo', value: EStatusGeral.Inativo }
  ];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      cod_empresa: [null, [Validators.required]],
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      senha: ['', [Validators.minLength(6)]],
      admin: [false],
      status: [EStatusGeral.Ativo, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.empresaService.listar().subscribe({
      next: (res) => this.empresas = res.data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar empresas' })
    });
  }

  abrir(id?: number) {
    this.usuarioId = id;
    this.visible = true;
    this.form.reset({ admin: false, status: EStatusGeral.Ativo });

    if (id) {
      this.form.get('senha')?.clearValidators();
    } else {
      this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.form.get('senha')?.updateValueAndValidity();

    if (id) {
      this.isLoadingData = true;
      this.usuarioService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados do usuário' });
          this.visible = false;
        }
      });
    }
  }

  onSave() {
    if (this.form.invalid) return;

    this.isSaving = true;
    const dados = { ...this.form.value, id: this.usuarioId };

    if (this.usuarioId && !dados.senha) {
      delete dados.senha;
    }

    this.usuarioService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Usuário ${this.usuarioId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Falha ao salvar usuário' });
        this.isSaving = false;
      }
    });
  }
}
