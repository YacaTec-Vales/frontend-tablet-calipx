import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional que protege rutas autenticadas.
 *
 * Verifica que exista un access token y que el usuario
 * no tenga el flag mustChangePassword activo (excepto
 * en la ruta de cambio de contrasena).
 */
export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Si el usuario debe cambiar contrasena, redirigir a login para que complete el flujo
  if (authService.mustChangePassword()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
