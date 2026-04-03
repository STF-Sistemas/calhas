import { Injectable, signal } from '@angular/core';
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

  constructor(private http: HttpClient, private router: Router) {
    this.loadStorage();
  }

  get token(): string | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data).token : null;
  }

  login(credentials: ILoginDto) {
    return this.http.post<TApiResponse<ILoginResponse>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(res.data));
          this.currentUser.set(res.data.usuario);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser.set(null);
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

  private loadStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      const auth = JSON.parse(data) as ILoginResponse;
      this.currentUser.set(auth.usuario);
    }
  }
}
