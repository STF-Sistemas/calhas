import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';
import { UsuarioService } from '#core/services/usuario.service';
import { IUsuario } from '#shared/interfaces';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    DataTableComponent, 
    UsuarioFormComponent, 
    ConfirmDialogModule,
    ToastModule,
    TagModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  providers: [ConfirmationService]
})
export class UsuariosComponent implements OnInit {
  @ViewChild('form') form!: UsuarioFormComponent;
  
  usuarios: IUsuario[] = [];
  loading = false;
  
  cols = [
    { field: 'nome', header: 'Nome' },
    { field: 'email', header: 'E-mail' },
    { field: 'perfil', header: 'Perfil' },
    { field: 'status', header: 'Status', type: 'status' }
  ];

  constructor(
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.loading = true;
    this.usuarioService.listar().subscribe({
      next: (res) => {
        // Formata perfil para exibição
        this.usuarios = res.data.map((u: IUsuario) => ({
          ...u,
          perfil: u.super_admin ? 'Super Admin' : (u.admin ? 'Admin' : 'Vendedor')
        }));
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar usuários' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(usuario: IUsuario) {
    this.form.abrir(usuario.id);
  }

  onDelete(usuario: IUsuario) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o usuário "${usuario.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.usuarioService.desativar(usuario.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário excluído' });
            this.carregarUsuarios();
          }
        });
      }
    });
  }
}
