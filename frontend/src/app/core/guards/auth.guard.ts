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
