import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './install-prompt.component.html',
  styleUrls: ['./install-prompt.component.scss']
})
export class InstallPromptComponent implements OnInit, OnDestroy {
  visible = false;

  private deferredPrompt: any = null;
  private readonly STORAGE_KEY = 'pwa-install-dismissed';
  private readonly DISMISS_DAYS = 7;

  ngOnInit() {
    if (!this.isMobile()) return;
    if (this.isInstalled()) return;
    if (this.wasDismissedRecently()) return;

    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  ngOnDestroy() {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  private onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredPrompt = event;
    this.visible = true;
  };

  private onAppInstalled = () => {
    this.visible = false;
    this.deferredPrompt = null;
  };

  async instalar() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.visible = false;
    }
    this.deferredPrompt = null;
  }

  dispensar() {
    this.visible = false;
    localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
  }

  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
      || window.innerWidth < 768;
  }

  private isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
  }

  private wasDismissedRecently(): boolean {
    const ts = localStorage.getItem(this.STORAGE_KEY);
    if (!ts) return false;
    const diff = Date.now() - parseInt(ts, 10);
    return diff < this.DISMISS_DAYS * 24 * 60 * 60 * 1000;
  }
}
