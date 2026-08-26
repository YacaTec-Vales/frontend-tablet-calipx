# Guía: Inyección de Headers en Peticiones HTTP (Angular)

En proyectos modernos de Angular (versión 17 o superior, usando la arquitectura de componentes *Standalone* y la API de `provideHttpClient`), hay dos formas principales de inyectar *headers* (cabeceras) en las peticiones que hacemos al backend: **manualmente en cada petición** (a nivel servicio) y **globalmente** (a través de un Interceptor).

---

## 1. Método Manual (A nivel Servicio)

Esta es la forma más directa y útil cuando solo necesitas los headers en **peticiones muy específicas** (por ejemplo, el inicio de sesión o la configuración de MFA).

**¿Cómo funciona?**
Al utilizar `HttpClient`, puedes pasar un objeto de opciones como tercer parámetro en peticiones `POST`/`PUT`, o como segundo en `GET`.

### Ejemplo Práctico (como lo hicimos en `AuthService`):

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://apiv2.yacatec.com/api/v1';

  // Ejemplo de petición POST con cabeceras personalizadas
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials, {
      headers: {
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  // Ejemplo con un Token de Autorización dinámico
  setupMfa(token: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/mfa/setup`, {}, {
      headers: {
        Authorization: `Bearer ${token}`, // Token inyectado
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }
}
```

> [!TIP]
> **Cuándo usarlo:** Útil para llamadas de autenticación iniciales donde aún no tienes un token global o requieres reglas muy únicas de enrutamiento.

---

## 2. Método Global (Usando un Interceptor)

La mejor práctica para inyectar headers requeridos por toda la API (como `Authorization` con tu Token o los custom headers de la empresa como `X-Client-App: Tecu` y `X-Origin: vpn`) es usando un **HttpInterceptor**.

El equipo de `develop` ya creó la base de este interceptor en tu proyecto (`src/app/core/interceptors/auth.interceptor.ts`).

### Paso 1: Crear el Interceptor

Un interceptor atrapa **todas** las peticiones que hace la aplicación antes de que salgan al internet, permitiéndote modificarlas (clonarlas) y agregarles las cabeceras.

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. Clonamos la petición para añadir los headers obligatorios de la empresa
  let clonedRequest = req.clone({
    setHeaders: {
      'X-Origin': 'vpn',
      'X-Client-App': 'Tecu'
    }
  });

  // 2. Si el usuario ya inició sesión y tiene un token, lo inyectamos globalmente
  if (token) {
    clonedRequest = clonedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 3. Dejamos que la petición modificada continúe su camino
  return next(clonedRequest);
};
```

### Paso 2: Registrar el Interceptor en la App

Para que Angular aplique este interceptor, debe declararse en el archivo `app.config.ts`. Si revisas ese archivo en tu proyecto, verás algo como esto:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Aquí le decimos a Angular que use nuestro interceptor
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

> [!IMPORTANT]
> **Cuándo usarlo:** Cuando **todas** o casi todas tus llamadas al Backend requieren la misma seguridad y cabeceras. Así evitas repetir código en cada método de tus servicios.

---

### Resumen del Flujo de MFA

En tu caso particular con el Login y MFA, se utilizaron ambos métodos por diseño:
- El Login y los Endpoints de comprobación de MFA inicial ocuparon el método manual, porque requerían manipular "Tokens Parciales" que aún no eran tu sesión definitiva.
- Para todas las demás pantallas y servicios (Cajera, Gerentes), se confía en el Interceptor Global para que cada clic en una tabla se vaya autenticado automáticamente.
