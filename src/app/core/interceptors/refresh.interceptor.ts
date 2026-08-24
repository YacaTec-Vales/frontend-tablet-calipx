import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Estado compartido para evitar multiples refresh simultaneos.
 *
 * Cuando un 401 dispara un refresh, las demas requests pendientes
 * se encolan hasta que el refresh resuelve. Esto evita que N requests
 * simultáneas disparen N refreshes.
 */
let isRefreshing = false;
const refreshSubject$ = new BehaviorSubject<string | null>(null);

/**
 * Interceptor funcional que detecta respuestas 401 e intenta
 * renovar el token automaticamente via POST /auth/refresh.
 *
 * Si el refresh funciona, reintenta la request original con el
 * nuevo token. Si falla, hace logout y redirige al login.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo interceptamos 401 en rutas que NO son de auth
      if (error.status !== 401 || req.url.includes('/auth/login') || req.url.includes('/auth/refresh') || req.url.includes('/auth/logout')) {
        return throwError(() => error);
      }

      if (!isRefreshing) {
        return handleRefresh(authService, req, next);
      }

      // Si ya hay un refresh en curso, encolar esta request
      return waitForRefresh(authService, req, next);
    }),
  );
};

/**
 * Ejecuta el refresh y reintenta la request original.
 */
function handleRefresh(
  authService: AuthService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<import('@angular/common/http').HttpEvent<unknown>> {
  isRefreshing = true;
  refreshSubject$.next(null);

  // Si no hay refresh token (ej: change-password revoco todas las sesiones), no intentar
  if (!authService.getRefreshToken()) {
    isRefreshing = false;
    authService.logout();
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'No refresh token' }));
  }

  return authService.refresh().pipe(
    switchMap((response) => {
      isRefreshing = false;
      const newToken = response.data.accessToken;
      refreshSubject$.next(newToken);

      // Reintentar la request original con el nuevo token
      const retryReq = req.clone({
        setHeaders: { Authorization: `Bearer ${newToken}` },
      });
      return next(retryReq);
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshSubject$.next(null);

      // El refresh fallo: sesion invalida, forzar logout
      authService.logout();
      return throwError(() => refreshError);
    }),
  );
}

/**
 * Espera a que el refresh en curso termine y reintenta
 * la request con el nuevo token.
 */
function waitForRefresh(
  authService: AuthService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<import('@angular/common/http').HttpEvent<unknown>> {
  return refreshSubject$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => {
      const retryReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(retryReq);
    }),
  );
}
