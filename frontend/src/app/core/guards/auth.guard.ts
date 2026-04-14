import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const validadeGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Super admin nunca é bloqueado
  if (authService.isSuperAdmin()) return true;

  if (authService.empresaExpirada()) {
    router.navigate(['/pagamento']);
    return false;
  }

  return true;
};

export const adminGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
  
    if (authService.isAdmin() || authService.isSuperAdmin()) {
      return true;
    }
  
    router.navigate(['/']);
    return false;
  };

  export const superAdminGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
  
    if (authService.isSuperAdmin()) {
      return true;
    }
  
    router.navigate(['/']);
    return false;
  };
