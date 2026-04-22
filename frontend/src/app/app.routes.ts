import { Routes } from '@angular/router';
import { authGuard, adminGuard, validadeGuard } from '#core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'orcamento/:token',
    loadComponent: () => import('./pages/orcamento-publico/orcamento-publico.component').then(m => m.OrcamentoPublicoComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent)
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./pages/redefinir-senha/redefinir-senha.component').then(m => m.RedefinirSenhaComponent)
  },
  {
    path: 'pagamento',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pagamento/pagamento.component').then(m => m.PagamentoComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard, validadeGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'meios-pagamento',
        loadComponent: () => import('./pages/meios-pagamento/meios-pagamento.component').then(m => m.MeiosPagamentoComponent)
      },
      {
        path: 'produtos',
        loadComponent: () => import('./pages/produtos/produtos.component').then(m => m.ProdutosComponent)
      },
      {
        path: 'chapas',
        loadComponent: () => import('./pages/chapas/chapas.component').then(m => m.ChapasComponent)
      },
      {
        path: 'servicos',
        loadComponent: () => import('./pages/servicos/servicos.component').then(m => m.ServicosComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'empresas',
        loadComponent: () => import('./pages/empresas/empresas.component').then(m => m.EmpresasComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'minha-empresa',
        loadComponent: () => import('./pages/minha-empresa/minha-empresa.component').then(m => m.MinhaEmpresaComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent)
      },
      {
        path: 'alterar-senha',
        loadComponent: () => import('./pages/alterar-senha/alterar-senha.component').then(m => m.AlterarSenhaComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.PedidosComponent)
      },
      {
        path: 'desenhos',
        loadComponent: () => import('./pages/desenhos/desenhos.component').then(m => m.DesenhosComponent)
      },
      {
        path: 'fornecedores',
        loadComponent: () => import('./pages/fornecedores/fornecedores.component').then(m => m.FornecedoresComponent)
      },
      {
        path: 'compras',
        loadComponent: () => import('./pages/compras/compras.component').then(m => m.ComprasComponent)
      },
      {
        path: 'relatorios/pedidos-lucros',
        loadComponent: () => import('./pages/relatorios/pedidos-lucros/pedidos-lucros.component').then(m => m.PedidosLucrosComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
