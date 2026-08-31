import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interceptor funcional que captura errores 500+ y los enmascara
 * para evitar Information Disclosure (fuga de trazas SQL, stacks, etc).
 *
 * FASE A: tambien traduce AUTH.ORIGIN_NOT_ALLOWED (403) a un mensaje
 * user-friendly que el componente de login pueda mostrar.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        const originalCode =
          error.error?.code ?? error.error?.error?.code ?? null;
        if (originalCode === 'AUTH.ORIGIN_NOT_ALLOWED') {
          const details =
            error.error?.details ?? error.error?.error?.details;
          const allowed =
            details?.allowedOrigins?.join(' o ') ?? 'red privada';
          const translated = new HttpErrorResponse({
            error: {
              message: `Esta cuenta solo puede iniciar sesion desde ${allowed}. Si necesitas entrar como administrador, abre vpn.taquizaschavez.com.mx.`,
              code: originalCode,
              data: details,
            },
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url || undefined,
          });
          return throwError(() => translated);
        }
      }
      if (error.status >= 500) {
        // Enmascarar error real en consola (opcionalmente registrar en servicio de logs)
        console.error('Error interno capturado por seguridad:', error.status);

        // Retornar un error genérico seguro para el frontend
        const safeError = new HttpErrorResponse({
          error: { message: 'Ocurrió un error interno, por favor intente más tarde.' },
          status: error.status,
          statusText: 'Internal Server Error',
          url: error.url || undefined
        });
        return throwError(() => safeError);
      }
      return throwError(() => error);
    })
  );
};
