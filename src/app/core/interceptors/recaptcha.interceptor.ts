import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { RecaptchaService } from '../services/recaptcha.service';

/** Header donde el backend espera el token de reCAPTCHA v3. */
export const RECAPTCHA_TOKEN_HEADER = 'x-recaptcha-token';

/** Métodos HTTP que exigen token según el `RecaptchaGuard` del API. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Adjunta un token fresco de reCAPTCHA v3 a cada petición mutante
 * (POST/PUT/PATCH/DELETE) via `x-recaptcha-token`.
 *
 * Comportamiento:
 *  - GET/HEAD/OPTIONS pasan sin token.
 *  - Con `recaptchaSiteKey` vacía (dev) pasa sin tocar la petición.
 *  - Si grecaptcha falla tras los reintentos del servicio, la
 *    peticion se RECHAZA (fail-CLOSED): el backend exige token en
 *    todos los metodos mutantes y enviar sin el es peor que avisar
 *    al usuario. Antes era fail-open y por eso produccion fallaba
 *    con 400 RECAPTCHA.MISSING cuando Google estaba lento o
 *    bloqueado por un ad blocker.
 */
export const recaptchaInterceptor: HttpInterceptorFn = (req, next) => {
  const recaptcha = inject(RecaptchaService);

  if (
    !MUTATING_METHODS.has(req.method.toUpperCase()) ||
    !recaptcha.isEnabled
  ) {
    return next(req);
  }

  return from(recaptcha.getToken()).pipe(
    switchMap((token) =>
      next(
        token
          ? req.clone({ setHeaders: { [RECAPTCHA_TOKEN_HEADER]: token } })
          : req,
      ),
    ),
    catchError((err) => {
      console.error(
        `[reCAPTCHA] fail-CLOSED: ${req.method} ${req.url}`,
        err,
      );
      return throwError(
        () =>
          new Error(
            'No se pudo verificar reCAPTCHA. Recarga la pagina o desactiva el bloqueador de anuncios.',
          ),
      );
    }),
  );
};