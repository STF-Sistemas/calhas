import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '#environments/environment';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const daApi = req.url.startsWith(environment.apiUrl);
  const token = daApi ? authService.token : null;

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!daApi) return throwError(() => error);
      if (error.status === 401 && token) {
        authService.logout();
      } else if (error.status === 402) {
        if (!authService.isSuperAdmin()) {
          router.navigate(['/pagamento']);
        }
      }
      return throwError(() => error);
    })
  );
};
