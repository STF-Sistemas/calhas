import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '#core/services/auth.service';
import { ThemeService } from '#core/services/theme.service';

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
    MenuModule
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit, OnDestroy {
  sidebarVisible = signal(false);
  isMobile = signal(false);
  currentYear = new Date().getFullYear();
  private resizeListener = () => this.checkBreakpoint();

  profileMenuItems: MenuItem[] = [
    { label: 'Meu Perfil', icon: 'pi pi-user' },
    { label: 'Configurações', icon: 'pi pi-cog' },
    { separator: true },
    { label: 'Sair do Sistema', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];

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
      label: 'Administração',
      items: [
        { label: 'Empresas', icon: 'pi pi-building', routerLink: '/empresas', roles: ['SUPER_ADMIN'] },
        { label: 'Usuários', icon: 'pi pi-user-edit', routerLink: '/usuarios', roles: ['ADMIN', 'SUPER_ADMIN'] }
      ]
    }
  ];

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    // Re-aplica o tema salvo para garantir consistência após navegação
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
