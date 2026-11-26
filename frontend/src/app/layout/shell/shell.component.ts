import {
  Component,
  signal,
  computed,
  DestroyRef,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { BadgeModule } from 'primeng/badge';
import { MenuItem } from 'primeng/api';
import { AuthService } from '#core/services/auth.service';
import { ThemeService } from '#core/services/theme.service';
import { NotificacaoService } from '#core/services/notificacao.service';
import { INotificacao } from '#shared/interfaces';
import { SITE_CONFIG } from '#core/config/site-config';
import { EmpresaForm } from '../../pages/empresas/empresa-form/empresa-form.component';
import { NovidadesDialog } from '#shared-frontend/components/novidades-dialog/novidades-dialog.component';
import { InstallPrompt } from '#shared-frontend/components/install-prompt/install-prompt.component';

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
    EmpresaForm,
    NovidadesDialog,
    InstallPrompt,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./shell.component.css'],
  host: { '(document:keydown.escape)': 'fecharMenuNoCelular()' },
})
export class Shell implements OnInit, OnDestroy {
  @ViewChild('empresaForm') empresaFormRef?: EmpresaForm;

  sidebarVisible = signal(false);
  isMobile = signal(false);
  private breakpointIniciado = false;
  currentYear = new Date().getFullYear();
  readonly siteConfig = SITE_CONFIG;

  readonly iniciais = computed(() => {
    const nome = this.authService.currentUser()?.nome?.trim() ?? '';
    const partes = nome.split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  });

  readonly atalhos = [
    { label: 'Início', icone: 'pi pi-home', rota: '/dashboard' },
    { label: 'Pedidos', icone: 'pi pi-shopping-cart', rota: '/pedidos' },
    { label: 'Clientes', icone: 'pi pi-users', rota: '/clientes' },
  ];

  readonly cores = [
    { id: 'orange', nome: 'laranja', hex: '#f97316' },
    { id: 'blue', nome: 'azul', hex: '#3b82f6' },
    { id: 'emerald', nome: 'esmeralda', hex: '#10b981' },
    { id: 'indigo', nome: 'índigo', hex: '#6366f1' },
  ];
  private resizeListener = () => this.checkBreakpoint();

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
    return {
      texto: `Sua licença vence em ${dias} dia${dias === 1 ? '' : 's'}.`,
      urgente: dias <= 3,
    };
  });

  notificacoes = signal<INotificacao[]>([]);
  carregandoNotificacoes = signal(false);

  readonly temNotificacaoPendente = computed(
    () => !!this.notificacaoLicenca() || this.notificacaoService.naoLidasCount() > 0,
  );

  get profileMenuItems(): MenuItem[] {
    const items: MenuItem[] = [];

    if (this.authService.isAdmin() || this.authService.isSuperAdmin()) {
      items.push({
        label: 'Minha Empresa',
        icon: 'pi pi-building',
        command: () => this.abrirMinhaEmpresa(),
      });
    }

    items.push(
      {
        label: this.themeService.isDarkMode() ? 'Modo claro' : 'Modo escuro',
        icon: this.themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon',
        command: () => this.themeService.toggleTheme(),
      },
      { label: 'Meu Perfil', icon: 'pi pi-user', command: () => this.router.navigate(['/perfil']) },
      {
        label: 'Alterar Senha',
        icon: 'pi pi-lock',
        command: () => this.router.navigate(['/alterar-senha']),
      },
      { separator: true },
      { label: 'Sair do Sistema', icon: 'pi pi-sign-out', command: () => this.logout() },
    );

    return items;
  }

  colorMenuItems: MenuItem[] = [
    {
      label: 'Laranja',
      icon: 'pi pi-circle-fill',
      style: { color: '#f97316' },
      command: () => this.themeService.setColor('orange'),
    },
    {
      label: 'Azul',
      icon: 'pi pi-circle-fill',
      style: { color: '#3b82f6' },
      command: () => this.themeService.setColor('blue'),
    },
    {
      label: 'Esmeralda',
      icon: 'pi pi-circle-fill',
      style: { color: '#10b981' },
      command: () => this.themeService.setColor('emerald'),
    },
    {
      label: 'Índigo',
      icon: 'pi pi-circle-fill',
      style: { color: '#6366f1' },
      command: () => this.themeService.setColor('indigo'),
    },
  ];

  menuGroups = [
    {
      label: 'Início',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: '/dashboard',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      label: 'Operacional',
      items: [
        {
          label: 'Pedidos',
          icon: 'pi pi-shopping-cart',
          routerLink: '/pedidos',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          label: 'Clientes',
          icon: 'pi pi-users',
          routerLink: '/clientes',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      label: 'Compras',
      items: [
        {
          label: 'Fornecedores',
          icon: 'pi pi-building',
          routerLink: '/fornecedores',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          label: 'Entrada de Estoque',
          icon: 'pi pi-truck',
          routerLink: '/compras',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      label: 'Catálogo',
      items: [
        {
          label: 'Meios de Pagamento',
          icon: 'pi pi-credit-card',
          routerLink: '/meios-pagamento',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          label: 'Produtos',
          icon: 'pi pi-box',
          routerLink: '/produtos',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          label: 'Chapas',
          icon: 'pi pi-clone',
          routerLink: '/chapas',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          label: 'Desenhos',
          icon: 'pi pi-pen-to-square',
          routerLink: '/desenhos',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          label: 'Serviços',
          icon: 'pi pi-cog',
          routerLink: '/servicos',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      label: 'Relatórios',
      items: [
        {
          label: 'Pedidos / Lucros',
          icon: 'pi pi-chart-bar',
          routerLink: '/relatorios/pedidos-lucros',
          roles: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      label: 'Administração',
      items: [
        {
          label: 'Minha Empresa',
          icon: 'pi pi-building',
          routerLink: null,
          action: () => this.abrirMinhaEmpresa(),
          roles: ['ADMIN'],
        },
        {
          label: 'Empresas',
          icon: 'pi pi-building-columns',
          routerLink: '/empresas',
          action: null,
          roles: ['SUPER_ADMIN'],
        },
        {
          label: 'Usuários',
          icon: 'pi pi-user-edit',
          routerLink: '/usuarios',
          action: null,
          roles: ['ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
  ];

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public notificacaoService: NotificacaoService,
    private router: Router,
    private destroyRef: DestroyRef,
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
    this.notificacaoService.iniciarPolling(this.destroyRef);
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fecharMenuNoCelular());
  }

  abrirNotificacoes(): void {
    this.carregandoNotificacoes.set(true);
    this.notificacaoService.listar().subscribe({
      next: (res) => {
        this.notificacoes.set(res.data);
        this.carregandoNotificacoes.set(false);
      },
      error: () => this.carregandoNotificacoes.set(false),
    });
  }

  marcarNotificacaoComoLida(notificacao: INotificacao): void {
    if (notificacao.lida) return;
    this.notificacaoService.marcarComoLida(notificacao.id).subscribe(() => {
      notificacao.lida = true;
      this.notificacaoService.decrementarContagem();
    });
  }

  marcarTodasNotificacoesComoLidas(): void {
    this.notificacaoService.marcarTodasComoLidas().subscribe(() => {
      this.notificacoes.update((lista) => lista.map((n) => ({ ...n, lida: true })));
      this.notificacaoService.zerarContagem();
    });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  fecharMenuNoCelular(): void {
    if (this.isMobile()) this.sidebarVisible.set(false);
  }

  private checkBreakpoint() {
    const mobile = window.innerWidth <= 991;
    if (this.breakpointIniciado && mobile === this.isMobile()) return;
    this.breakpointIniciado = true;
    this.isMobile.set(mobile);
    this.sidebarVisible.set(!mobile);
  }

  toggleSidebar() {
    this.sidebarVisible.update((v: boolean) => !v);
  }

  getFilteredGroups() {
    return this.menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.roles.includes('SUPER_ADMIN') && this.authService.isSuperAdmin()) return true;
          if (
            item.roles.includes('ADMIN') &&
            (this.authService.isAdmin() || this.authService.isSuperAdmin())
          )
            return true;
          if (item.roles.includes('USUARIO')) return true;
          return false;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }

  logout() {
    this.authService.logout();
  }
}
