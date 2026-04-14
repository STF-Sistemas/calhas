import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ILoginDto, ILoginResponse, IUsuario } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'calhas_auth';

  currentUser = signal<IUsuario | null>(null);
  empresaExpiracao = signal<Date | null>(null);

  /** Dias restantes até o vencimento. Null se sem validade definida. Negativo se expirado. */
  readonly diasParaVencer = computed(() => {
    const exp = this.empresaExpiracao();
    if (!exp) return null;
    const diff = new Date(exp).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  /** True se a licença estiver expirada. */
  readonly empresaExpirada = computed(() => {
    const dias = this.diasParaVencer();
    return dias !== null && dias < 0;
  });

  constructor(private http: HttpClient, private router: Router) {
    this.loadStorage();
  }

  /** Retorna o token apenas se ainda for válido (não expirado). */
  get token(): string | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    try {
      const auth = JSON.parse(data) as ILoginResponse;
      if (!auth?.token) return null;

      // Decodifica o payload do JWT (sem biblioteca externa — só base64)
      const payloadB64 = auth.token.split('.')[1];
      if (!payloadB64) return null;

      const payload = JSON.parse(atob(payloadB64));
      const expMs = (payload.exp as number) * 1000;

      if (Date.now() >= expMs) {
        this.logout();
        return null;
      }

      return auth.token;
    } catch {
      this.logout();
      return null;
    }
  }

  login(credentials: ILoginDto) {
    return this.http.post<TApiResponse<ILoginResponse>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(res.data));
          this.currentUser.set(res.data.usuario);
          this.empresaExpiracao.set(res.data.empresa_expiracao ? new Date(res.data.empresa_expiracao) : null);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser.set(null);
    this.empresaExpiracao.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  isAdmin(): boolean {
    return this.currentUser()?.admin || false;
  }

  isSuperAdmin(): boolean {
    return this.currentUser()?.super_admin || false;
  }

  /** Atualiza a data de expiração no storage e no signal (após confirmação de pagamento). */
  atualizarEmpresaExpiracao(novaExpiracao: Date): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const auth = JSON.parse(data) as ILoginResponse;
        auth.empresa_expiracao = novaExpiracao.toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(auth));
      } catch { /* ignore */ }
    }
    this.empresaExpiracao.set(novaExpiracao);
  }

  private loadStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return;

    try {
      const auth = JSON.parse(data) as ILoginResponse;
      if (auth?.token) {
        const payloadB64 = auth.token.split('.')[1];
        if (payloadB64) {
          const payload = JSON.parse(atob(payloadB64));
          if (Date.now() < (payload.exp as number) * 1000) {
            this.currentUser.set(auth.usuario);
            this.empresaExpiracao.set(auth.empresa_expiracao ? new Date(auth.empresa_expiracao) : null);
            return;
          }
        }
      }
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
