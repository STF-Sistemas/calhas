import { Routes } from '@angular/router';
import { authGuard, adminGuard } from '#core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
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
        path: 'pedidos',
        loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.PedidosComponent)
      },
      {
        path: 'desenhos',
        loadComponent: () => import('./pages/desenhos/desenhos.component').then(m => m.DesenhosComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
