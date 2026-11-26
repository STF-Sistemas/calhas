import { Routes } from '@angular/router';
import { authGuard, adminGuard, validadeGuard } from '#core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'orcamento/:token',
    loadComponent: () => import('./pages/orcamento-publico/orcamento-publico.component').then(m => m.OrcamentoPublico)
  },
  {
    path: 'ordem-corte/:token',
    loadComponent: () => import('./pages/ordem-corte-publico/ordem-corte-publico.component').then(m => m.OrdemCortePublico)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.Login)
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenha)
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./pages/redefinir-senha/redefinir-senha.component').then(m => m.RedefinirSenha)
  },
  {
    path: 'pagamento',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pagamento/pagamento.component').then(m => m.Pagamento)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.Shell),
    canActivate: [authGuard, validadeGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.Dashboard)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes.component').then(m => m.Clientes)
      },
      {
        path: 'meios-pagamento',
        loadComponent: () => import('./pages/meios-pagamento/meios-pagamento.component').then(m => m.MeiosPagamento)
      },
      {
        path: 'produtos',
        loadComponent: () => import('./pages/produtos/produtos.component').then(m => m.Produtos)
      },
      {
        path: 'chapas',
        loadComponent: () => import('./pages/chapas/chapas.component').then(m => m.Chapas)
      },
      {
        path: 'servicos',
        loadComponent: () => import('./pages/servicos/servicos.component').then(m => m.Servicos)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.Usuarios)
      },
      {
        path: 'empresas',
        loadComponent: () => import('./pages/empresas/empresas.component').then(m => m.Empresas),
        canActivate: [adminGuard]
      },
      {
        path: 'minha-empresa',
        loadComponent: () => import('./pages/minha-empresa/minha-empresa.component').then(m => m.MinhaEmpresa),
        canActivate: [adminGuard]
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.Perfil)
      },
      {
        path: 'alterar-senha',
        loadComponent: () => import('./pages/alterar-senha/alterar-senha.component').then(m => m.AlterarSenha)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.Pedidos)
      },
      {
        path: 'desenhos',
        loadComponent: () => import('./pages/desenhos/desenhos.component').then(m => m.Desenhos)
      },
      {
        path: 'fornecedores',
        loadComponent: () => import('./pages/fornecedores/fornecedores.component').then(m => m.Fornecedores)
      },
      {
        path: 'compras',
        loadComponent: () => import('./pages/compras/compras.component').then(m => m.Compras)
      },
      {
        path: 'relatorios/pedidos-lucros',
        loadComponent: () => import('./pages/relatorios/pedidos-lucros/pedidos-lucros.component').then(m => m.PedidosLucros)
      },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
