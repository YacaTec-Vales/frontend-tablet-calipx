import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { throwError } from 'rxjs';

/** Rutas publicas que NO necesitan Authorization header */
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/mfa-verify',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/health/',
];

/**
 * Interceptor funcional que inyecta el Bearer token y
 * el header x-client-app en cada request autenticada.
 *
 * Excluye automaticamente las rutas publicas definidas
 * en el backend (login, refresh, password-reset, health).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));

  if (isPublic) {
    // Rutas publicas solo necesitan el header x-client-app y x-origin
    const publicReq = req.clone({
      setHeaders: { 
        'x-client-app': 'Calipx'
      },
    });
    return next(publicReq);
  }

  const token = authService.getAccessToken();

  if (!token) {
    // Si no hay token en una ruta protegida (ej. BFCache restore o bug), bloqueamos
    authService.currentUser.set(null);
    router.navigate(['/login']);
    return throwError(() => new Error('No autorizado: No hay token en localStorage'));
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'x-client-app': 'Calipx'
    },
  });

  return next(authReq);
};
