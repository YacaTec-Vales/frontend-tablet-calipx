import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

/**
 * Fabrica de guards funcionales que restringe acceso por rol.
 *
 * Uso en rutas:
 *   canActivate: [roleGuard('COORDINADOR')]
 *   canActivate: [roleGuard('VERIFICADOR')]
 *
 * Si el usuario no tiene el rol requerido, redirige a la
 * seccion correspondiente a su rol real.
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();

    if (!userRole) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirigir al area correcta segun el rol del usuario
    switch (userRole) {
      case 'COORDINADOR':
        router.navigate(['/coordinador']);
        break;
      case 'VERIFICADOR':
        router.navigate(['/verificador']);
        break;
      default:
        router.navigate(['/login']);
        break;
    }

    return false;
  };
}
