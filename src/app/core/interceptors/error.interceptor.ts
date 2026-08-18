import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interceptor funcional que captura errores 500+ y los enmascara
 * para evitar Information Disclosure (fuga de trazas SQL, stacks, etc).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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
