import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '#environments/environment';
import { ILoginDto, ILoginResponse, IUsuario } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'calhas_auth';

  currentUser = signal<IUsuario | null>(null);
  empresaExpiracao = signal<Date | null>(null);

  readonly diasParaVencer = computed(() => {
    const exp = this.empresaExpiracao();
    if (!exp) return null;
    const diff = new Date(exp).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly empresaExpirada = computed(() => {
    const dias = this.diasParaVencer();
    return dias !== null && dias < 0;
  });

  private get armazenamento(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  constructor(private http: HttpClient, private router: Router) {
    this.loadStorage();
  }

  get token(): string | null {
    const data = this.armazenamento?.getItem(this.STORAGE_KEY);
    if (!data) return null;

    try {
      const auth = JSON.parse(data) as ILoginResponse;
      if (!auth?.token) return null;

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
          this.armazenamento?.setItem(this.STORAGE_KEY, JSON.stringify(res.data));
          this.currentUser.set(res.data.usuario);
          this.empresaExpiracao.set(res.data.empresa_expiracao ? new Date(res.data.empresa_expiracao) : null);
        }
      })
    );
  }

  logout() {
    this.armazenamento?.removeItem(this.STORAGE_KEY);
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

  atualizarToken(token: string): void {
    const data = this.armazenamento?.getItem(this.STORAGE_KEY);
    if (!data) return;
    try {
      const auth = JSON.parse(data) as ILoginResponse;
      auth.token = token;
      this.armazenamento?.setItem(this.STORAGE_KEY, JSON.stringify(auth));
    } catch { }
  }

  atualizarEmpresaExpiracao(novaExpiracao: Date): void {
    const data = this.armazenamento?.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const auth = JSON.parse(data) as ILoginResponse;
        auth.empresa_expiracao = novaExpiracao.toISOString();
        this.armazenamento?.setItem(this.STORAGE_KEY, JSON.stringify(auth));
      } catch { }
    }
    this.empresaExpiracao.set(novaExpiracao);
  }

  private loadStorage() {
    const data = this.armazenamento?.getItem(this.STORAGE_KEY);
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
      this.armazenamento?.removeItem(this.STORAGE_KEY);
    } catch {
      this.armazenamento?.removeItem(this.STORAGE_KEY);
    }
  }
}
