import { Component, signal, computed, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService } from 'primeng/api';
import { AuthService } from '#core/services/auth.service';
import { ThemeService } from '#core/services/theme.service';
import { EmpresaFormComponent } from '../../pages/empresas/empresa-form/empresa-form.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DrawerModule,
    ButtonModule,
    RippleModule,
    AvatarModule,
    TooltipModule,
    MenuModule,
    MessageModule,
    PopoverModule,
    BadgeModule,
    ToastModule,
    EmpresaFormComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit, OnDestroy {
  @ViewChild('empresaForm') empresaFormRef?: EmpresaFormComponent;

  sidebarVisible = signal(false);
  isMobile = signal(false);
  currentYear = new Date().getFullYear();
  private resizeListener = () => this.checkBreakpoint();

  // ── Alerta de vencimento de licença ──────────────────────────────────────────
  readonly diasParaVencer = computed(() => this.authService.diasParaVencer());

  readonly alertaLicenca = computed(() => {
    const dias = this.diasParaVencer();
    if (dias === null || dias !== 0 || this.authService.isSuperAdmin()) return null;
    return { severity: 'error', label: 'Vence hoje! Renove para não perder o acesso.', dias };
  });

  readonly notificacaoLicenca = computed(() => {
    const dias = this.diasParaVencer();
    if (dias === null || dias > 10 || this.authService.isSuperAdmin()) return null;
    if (dias === 0) return { texto: 'Sua licença vence hoje!', urgente: true };
    if (dias < 0) return { texto: 'Sua licença está vencida.', urgente: true };
    return { texto: `Sua licença vence em ${dias} dia${dias === 1 ? '' : 's'}.`, urgente: dias <= 3 };
  });

  // Menu de perfil: "Minha Empresa" só aparece para admin/super_admin
  get profileMenuItems(): MenuItem[] {
    const items: MenuItem[] = [];

    if (this.authService.isAdmin() || this.authService.isSuperAdmin()) {
      items.push({
        label: 'Minha Empresa',
        icon: 'pi pi-building',
        command: () => this.abrirMinhaEmpresa()
      });
    }

    items.push(
      { label: 'Meu Perfil', icon: 'pi pi-user', command: () => this.router.navigate(['/perfil']) },
      { label: 'Alterar Senha', icon: 'pi pi-lock', command: () => this.router.navigate(['/alterar-senha']) },
      { separator: true },
      { label: 'Sair do Sistema', icon: 'pi pi-sign-out', command: () => this.logout() }
    );

    return items;
  }

  colorMenuItems: MenuItem[] = [
    { label: 'Laranja', icon: 'pi pi-circle-fill', style: { color: '#f97316' }, command: () => this.themeService.setColor('orange') },
    { label: 'Azul', icon: 'pi pi-circle-fill', style: { color: '#3b82f6' }, command: () => this.themeService.setColor('blue') },
    { label: 'Esmeralda', icon: 'pi pi-circle-fill', style: { color: '#10b981' }, command: () => this.themeService.setColor('emerald') },
    { label: 'Índigo', icon: 'pi pi-circle-fill', style: { color: '#6366f1' }, command: () => this.themeService.setColor('indigo') },
  ];

  menuGroups = [
    {
      label: 'Início',
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] }
      ]
    },
    {
      label: 'Operacional',
      items: [
        { label: 'Pedidos', icon: 'pi pi-shopping-cart', routerLink: '/pedidos', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] },
        { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] }
      ]
    },
    {
      label: 'Compras',
      items: [
        { label: 'Fornecedores', icon: 'pi pi-building', routerLink: '/fornecedores', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] },
        { label: 'Entrada de Estoque', icon: 'pi pi-truck', routerLink: '/compras', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] }
      ]
    },
    {
      label: 'Catálogo',
      items: [
        { label: 'Meios de Pagamento', icon: 'pi pi-credit-card', routerLink: '/meios-pagamento', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] },
        { label: 'Produtos', icon: 'pi pi-box', routerLink: '/produtos', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] },
        { label: 'Chapas', icon: 'pi pi-clone', routerLink: '/chapas', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] },
        { label: 'Desenhos', icon: 'pi pi-pen-to-square', routerLink: '/desenhos', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] },
        { label: 'Serviços', icon: 'pi pi-cog', routerLink: '/servicos', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] }
      ]
    },
    {
      label: 'Relatórios',
      items: [
        { label: 'Pedidos / Lucros', icon: 'pi pi-chart-bar', routerLink: '/relatorios/pedidos-lucros', roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'] }
      ]
    },
    {
      label: 'Administração',
      items: [
        { label: 'Minha Empresa', icon: 'pi pi-building', routerLink: null, action: () => this.abrirMinhaEmpresa(), roles: ['ADMIN'] },
        { label: 'Empresas', icon: 'pi pi-building-columns', routerLink: '/empresas', action: null, roles: ['SUPER_ADMIN'] },
        { label: 'Usuários', icon: 'pi pi-user-edit', routerLink: '/usuarios', action: null, roles: ['ADMIN', 'SUPER_ADMIN'] }
      ]
    }
  ];

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  onSidebarItemClick(item: { action?: (() => void) | null; [key: string]: unknown }) {
    if (item.action) item.action();
    if (this.isMobile()) this.sidebarVisible.set(false);
  }

  abrirMinhaEmpresa() {
    if (!this.empresaFormRef) return;
    const codEmpresa = this.authService.currentUser()?.cod_empresa ?? undefined;
    this.empresaFormRef.abrir(codEmpresa);
  }

  irParaPagamento() {
    this.router.navigate(['/pagamento']);
  }

  ngOnInit() {
    this.themeService.applyTheme();
    this.checkBreakpoint();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  private checkBreakpoint() {
    this.isMobile.set(window.innerWidth <= 991);
    if (!this.isMobile()) {
      this.sidebarVisible.set(true);
    } else {
      this.sidebarVisible.set(false);
    }
  }

  toggleSidebar() {
    this.sidebarVisible.update((v: boolean) => !v);
  }

  getFilteredGroups() {
    return this.menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.roles.includes('SUPER_ADMIN') && this.authService.isSuperAdmin()) return true;
        if (item.roles.includes('ADMIN') && (this.authService.isAdmin() || this.authService.isSuperAdmin())) return true;
        if (item.roles.includes('USUARIO')) return true;
        return false;
      })
    })).filter(group => group.items.length > 0);
  }

  logout() {
    this.authService.logout();
  }
}
