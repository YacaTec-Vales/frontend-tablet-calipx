import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { DdosProtectionService } from '../services/ddos-protection.service';

/**
 * Headers canónicos que el backend puede usar para correlacionar y
 * bloquear clientes abusivos sin re-implementar el rate-limit en
 * cada servicio.
 */
export const FINGERPRINT_HEADER = 'x-client-fingerprint';
export const REQUEST_ID_HEADER = 'x-request-id';
export const CLIENT_TIMESTAMP_HEADER = 'x-client-timestamp';

/**
 * Interceptor funcional que aplica la política de mitigación
 * cooperante antes de cualquier petición al backend:
 *
 *  1. Circuit breaker: corta el envío si el origen lleva rato
 *     respondiendo con 5xx, evitando amplificar la caída.
 *  2. Rate-limit: si el bucket del patrón está vacío, retrasa la
 *     petición en lugar de saturar el servidor.
 *  3. Huella + request-id: firma cada petición con datos estables
 *     del cliente para que el WAF/backend pueda agrupar abusos.
 *  4. Telemetría de resultado: alimenta el circuit breaker con el
 *     status real de cada respuesta.
 *
 * El servicio expone `isEnabled` para apagar el interceptor en
 * dev local cuando `environment.ddosProtection` sea false.
 */
export const ddosProtectionInterceptor: HttpInterceptorFn = (req, next) => {
  const ddos = inject(DdosProtectionService);

  if (!environment.ddosProtection) {
    return next(req);
  }

  const stamped = stampRequest(req, ddos);

  if (!ddos.canSend()) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 503,
          statusText: 'Service Unavailable',
          error: {
            message:
              'Servicio temporalmente no disponible. Reintentaremos en breve.',
            code: 'CIRCUIT_OPEN',
          },
          url: stamped.url ?? undefined,
        }),
    );
  }

  return defer(ddos, stamped, next);
};

function defer(
  ddos: DdosProtectionService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const decision = ddos.checkRateLimit(req.url);

  if (decision.kind === 'reject') {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 429,
          statusText: 'Too Many Requests',
          error: { message: decision.reason, code: 'CLIENT_RATE_LIMIT' },
          url: req.url ?? undefined,
        }),
    );
  }

  if (decision.kind === 'allow') {
    return send(ddos, req, next, performance.now());
  }

  return timer(decision.waitMs).pipe(
    switchMap(() => defer(ddos, req, next)),
  );
}

function send(
  ddos: DdosProtectionService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  startedAt: number,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap((event) => {
      if (
        event &&
        typeof event === 'object' &&
        'status' in event &&
        typeof (event as { status: unknown }).status === 'number'
      ) {
        const latency = performance.now() - startedAt;
        ddos.recordOutcome((event as { status: number }).status, latency);
      }
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        ddos.recordOutcome(err.status, performance.now() - startedAt);
      } else {
        ddos.recordTransportError();
      }
      return throwError(() => err);
    }),
  );
}

function stampRequest(
  req: HttpRequest<unknown>,
  ddos: DdosProtectionService,
): HttpRequest<unknown> {
  const fingerprint = ddos.getClientFingerprint();
  const requestId = ddos.newRequestId();
  const timestamp = Date.now().toString();

  return req.clone({
    setHeaders: {
      [FINGERPRINT_HEADER]: fingerprint,
      [REQUEST_ID_HEADER]: requestId,
      [CLIENT_TIMESTAMP_HEADER]: timestamp,
    },
  });
}
