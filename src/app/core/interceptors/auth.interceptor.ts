import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Rutas publicas que NO necesitan Authorization header */
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/health/',
];

/**
 * Interceptor funcional que inyecta el Bearer token y
 * el header Device en cada request autenticada.
 *
 * Excluye automaticamente las rutas publicas definidas
 * en el backend (login, refresh, password-reset, health).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));

  if (isPublic) {
    // Rutas publicas solo necesitan el header Device
    const publicReq = req.clone({
      setHeaders: { Device: 'Calipx' },
    });
    return next(publicReq);
  }

  const token = authService.getAccessToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      Device: 'Calipx',
    },
  });

  return next(authReq);
};
