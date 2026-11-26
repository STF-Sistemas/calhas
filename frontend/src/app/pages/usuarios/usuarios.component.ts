import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { UsuarioForm } from './usuario-form/usuario-form.component';
import { UsuarioService } from '#core/services/usuario.service';
import { IUsuario } from '#shared/interfaces';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    DataTable,
    UsuarioForm,
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Usuarios implements OnInit {
  @ViewChild('form') form!: UsuarioForm;

  usuarios: IUsuario[] = [];
  loading = false;

  cols = [
    { field: 'nome', header: 'Nome' },
    { field: 'email', header: 'E-mail' },
    { field: 'perfil', header: 'Perfil' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private usuarioService: UsuarioService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.loading = true;
    this.usuarioService.listar().subscribe({
      next: (res) => {
        this.usuarios = res.data.map((u: IUsuario) => ({
          ...u,
          perfil: u.super_admin ? 'Super Admin' : u.admin ? 'Admin' : 'Vendedor',
        }));
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar usuários');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(usuario: IUsuario) {
    this.form.abrir(usuario.id);
  }

  onDelete(usuario: IUsuario) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o usuário "${usuario.nome}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.usuarioService.desativar(usuario.id).subscribe({
          next: () => {
            this.toast.success('Usuário excluído');
            this.carregarUsuarios();
          },
        });
    });
  }
}
