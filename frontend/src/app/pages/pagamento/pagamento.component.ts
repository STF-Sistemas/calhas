import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PagamentoService } from '#core/services/pagamento.service';
import { AuthService } from '#core/services/auth.service';
import { ThemeService } from '#core/services/theme.service';
import { IPagamentoPix } from '#shared/interfaces';

@Component({
  selector: 'app-pagamento',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule, MessageModule, ToastModule, TooltipModule],
  templateUrl: './pagamento.component.html',
  styleUrls: ['./pagamento.component.scss'],
})
export class PagamentoComponent implements OnInit, OnDestroy {
  carregando = signal(true);
  erro = signal<string | null>(null);
  pagamento = signal<IPagamentoPix | null>(null);
  manual = signal(false);
  pixChave = signal<string | null>(null);
  valor = signal(150);
  confirmado = signal(false);
  copiado = signal(false);
  redirecionandoEm = signal(0);

  private pollInterval?: ReturnType<typeof setInterval>;
  private redirectInterval?: ReturnType<typeof setInterval>;

  readonly qrCodeSrc = computed(() => {
    const base64 = this.pagamento()?.qr_code_base64;
    return base64 ? `data:image/png;base64,${base64}` : null;
  });

  readonly pixCopiaECola = computed(() => {
    const p = this.pagamento();
    if (!p) return null;
    // Em modo manual: qr_code armazena a chave Pix
    return p.qr_code;
  });

  constructor(
    private pagamentoService: PagamentoService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.themeService.applyTheme();

    // Super admin não precisa de pagamento
    if (this.authService.isSuperAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.iniciarCobranca();
  }

  ngOnDestroy() {
    this.pararPolling();
    this.pararRedirecionamento();
  }

  iniciarCobranca() {
    this.carregando.set(true);
    this.erro.set(null);

    this.pagamentoService.criarPix().subscribe({
      next: (res) => {
        if (res.success) {
          this.pagamento.set(res.data.pagamento);
          this.manual.set(res.data.manual);
          this.pixChave.set(res.data.pix_chave);
          this.valor.set(res.data.valor ?? 150);
          this.carregando.set(false);

          if (res.data.pagamento?.status !== 'aprovado') {
            this.iniciarPolling();
          } else {
            this.onPagamentoConfirmado(null);
          }
        }
      },
      error: () => {
        this.erro.set('Não foi possível gerar a cobrança. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }

  private iniciarPolling() {
    this.pararPolling();
    this.pollInterval = setInterval(() => this.verificarStatus(), 5000);
  }

  private pararPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private verificarStatus() {
    const pag = this.pagamento();
    if (!pag || pag.status === 'aprovado') { this.pararPolling(); return; }

    this.pagamentoService.verificarStatus(pag.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.pagamento.set(res.data.pagamento);
          if (res.data.pagamento.status === 'aprovado') {
            this.pararPolling();
            this.onPagamentoConfirmado(res.data.nova_expiracao ?? null);
          }
        }
      },
      error: () => { /* ignora erros de polling */ },
    });
  }

  private onPagamentoConfirmado(novaExpiracao: string | null) {
    this.confirmado.set(true);
    if (novaExpiracao) {
      this.authService.atualizarEmpresaExpiracao(new Date(novaExpiracao));
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Pagamento confirmado!',
      detail: 'Sua licença foi renovada por 30 dias.',
      life: 8000,
    });
    this.redirecionandoEm.set(5);
    this.redirectInterval = setInterval(() => {
      this.redirecionandoEm.update(v => v - 1);
      if (this.redirecionandoEm() <= 0) {
        this.pararRedirecionamento();
        this.router.navigate(['/dashboard']);
      }
    }, 1000);
  }

  private pararRedirecionamento() {
    if (this.redirectInterval) {
      clearInterval(this.redirectInterval);
      this.redirectInterval = undefined;
    }
  }

  copiarCodigo() {
    const codigo = this.pixCopiaECola();
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => {
      this.copiado.set(true);
      this.messageService.add({ severity: 'success', summary: 'Copiado!', detail: 'Código Pix copiado para a área de transferência.', life: 3000 });
      setTimeout(() => this.copiado.set(false), 3000);
    });
  }

  irParaDashboard() {
    this.pararRedirecionamento();
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
  }
}
