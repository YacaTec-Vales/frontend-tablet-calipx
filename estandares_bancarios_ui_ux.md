# Estándares Bancarios de UI/UX, Seguridad y Validaciones

Esta es la lista de tareas y buenas prácticas maestras que debe seguirse a través de todos los repositorios de frontend (Desktop, Tablet y Mobile) para garantizar un sistema a la altura de un entorno bancario y financiero seguro.

# Manual Maestro de Arquitectura, Estándares Bancarios y Plan de Implementación

Este documento consolida las buenas prácticas, la arquitectura de seguridad, los lineamientos de UI/UX y el plan de acción táctico que deben seguirse para garantizar un sistema a la altura de un entorno bancario y financiero seguro.

---

## PARTE I: Estándares Bancarios de UI/UX, Seguridad y Validaciones

### 1. Seguridad y Ocultamiento Tecnológico (Anti-Fingerprinting)
- `[ ]` **Deshabilitar metadatos del Framework:** En el archivo `main.ts` o `app.config.ts` de Angular, asegúrate de deshabilitar la inyección de atributos que delatan la tecnología (ej. `ng-version`), llamando a `enableProdMode()` y configurando el bootstrap para que no emita advertencias.
- `[ ]` **Eliminación de SourceMaps:** En producción (`angular.json`), asegurar que `"sourceMap": false` y `"optimization": true`. Un usuario malicioso nunca debe poder reconstruir el código fuente original ni ver la estructura de tus archivos `.ts` en el navegador.
- `[ ]` **Ofuscación Activa:** Para repositorios críticos, usar una capa extra de ofuscación en la compilación web (ej. `javascript-obfuscator`) para minificar agresivamente nombres de variables y lógica de negocio sensible (como cálculos financieros que ocurran en el cliente).
- `[ ]` **Gestión de Respuestas (Information Disclosure):** El frontend JAMÁS debe imprimir directamente el objeto de error crudo (`error.message` o `stacktrace`) del servidor. Si el servidor devuelve un error 500 con detalles SQL, el interceptor de Angular debe capturarlo y transformarlo en un mensaje genérico ("Error interno, por favor intente más tarde").
- `[ ]` **Cero Almacenamiento de Secretos:** Los JWT y Tokens nunca deben guardarse en `localStorage` o `sessionStorage` puro si es evitable. En un entorno bancario ideal, se usan *Cookies HttpOnly*, o bien los tokens se manejan únicamente en memoria (servicios de estado de Angular) para evitar ataques XSS.

### 2. Validaciones Estrictas de Entrada (Input / Sanitización)
- `[ ]` **Bloqueo a nivel Evento (Keypress):** Para montos y IDs numéricos, no basta con validar al darle "Enviar". Bloquea la entrada de letras y caracteres especiales al vuelo configurando adecuadamente el `type`, `inputmode="numeric"` y previniendo eventos nativos si la tecla presionada no está en una lista blanca.
- `[ ]` **Validación de URLs Estricta:** Si la app consume URLs o IDs desde la barra de direcciones (Ej. `/solicitudes/123`), implementar *Guards* (`CanActivate`) que intercepten la ruta. Si la estructura de la ruta no concuerda con un UUID válido (evitar IDs secuenciales `1, 2, 3`), redirigir a 404 de inmediato para prevenir ataques *IDOR*.
- `[ ]` **Sanitización contra XSS:** No usar jamás `[innerHTML]` para renderizar datos provenientes de la base de datos (como nombres de usuarios o notas) sin pasarlos antes por el `DomSanitizer` nativo de Angular.
- `[ ]` **Longitudes Máximas y Mínimas Restringidas:** Todo input (nombres, descripciones) debe tener obligatoriamente `maxlength` declarado en el HTML y en las reglas del `FormControl` de Angular, para prevenir ataques por *Buffer Overflow* o cargas enormes de texto.

### 3. UI/UX: Patrones de Interacción Financiera
- `[ ]` **Alertas y Feedback del Sistema (Toasts):**
  - **Éxito (Verdes):** Mensaje corto, claro y auto-descartable a los 3-5 segundos (Ej. "Abono registrado con éxito").
  - **Advertencia (Amarillos):** Aparecen antes de realizar una acción destructiva (ej. cancelar un vale). Requieren acción manual.
  - **Error (Rojos):** JAMÁS deben desaparecer automáticamente. El usuario debe leer qué falló (ej. "Fondos insuficientes") y cerrarlo manualmente.
- `[ ]` **Prevención de Doble Transacción (Loaders en Botones):** Todo botón que ejecute peticiones financieras `POST/PUT/PATCH` debe deshabilitarse inmediatamente (`[disabled]="isLoading"`) al primer clic, y mostrar un icono de *spinner* rotando internamente. Esto previene que un usuario con lag le dé dos clics a "Pagar" y duplique el cobro.
- `[ ]` **Validación de Errores Inline:**
  - Los errores en formularios (ej. "El correo es inválido") solo deben mostrarse **después** de que el usuario haya interactuado con el campo (`touched` y `dirty`).
  - Si es inválido, el contorno completo del Input se vuelve rojo, y el texto explicativo de error aparece justo debajo en un tamaño más pequeño y color de alerta.
- `[ ]` **Loaders de Pantalla (Skeleton Screens):** En lugar de un spinner girando en el medio de la nada, usar cajas grises parpadeantes (*Skeletons*) que imiten la forma de la tabla o tarjeta que está por cargar. Reduce la ansiedad y da percepción de un sistema veloz.
- `[ ]` **Privacidad (Modo Discreto):** Todo campo monetario sensible (Saldos Totales, Ganancias) debe estar ofuscado por defecto (ej. `$***.**`) hasta que el usuario toque un icono de un ojo. (Esto es vital para sucursales o tablets en mostrador).

### 4. Adaptabilidad según Repositorio (Platform Specifics)
- `[ ]` **Desktop (Admin / Gerencia):** Priorizar la densidad de información. Maximizar el uso de *DataTables* con filtros complejos por columnas, menús de escritorio fijos, atajos de teclado y modales anchos (`maxWidth="lg"`).
- `[ ]` **Tablet (Cajeros / Coordinadores):** Enfoque híbrido. Botones más altos (Mínimo `44px x 44px` área cliqueable por estándar de Apple/Google) para evitar toques fantasma. El scroll debe ser táctil y las tablas deben poder desplazarse lateralmente con los dedos de manera suave (`overflow-x-auto overflow-y-hidden`).
- `[ ]` **Mobile (Clientes / Distribuidores):** Diseño minimalista en tarjetas. Evitar Tablas a toda costa (colapsarlas en *List Cards* de 1 columna). Utilizar siempre teclados nativos optimizados (`inputmode="decimal"` para montos, `type="tel"` para teléfonos) para que el teclado del móvil se adapte sin forzar al usuario. Implementar navegación rápida e inferior (Bottom Tabs).

---

## PARTE II: Arquitectura de Seguridad y Gestión de Tokens (Angular)

### 1. El Servicio (`AuthService`): Almacenamiento Seguro (En Memoria)
Para cumplir con la política de "Cero Almacenamiento de Secretos", los tokens JWT jamás deben guardarse en `localStorage` o `sessionStorage`. 
*   La aplicación consumirá el endpoint `POST /api/v1/auth/login`, el cual devuelve el `accessToken` y el `refreshToken` en el cuerpo de la respuesta JSON.
*   Estos tokens se guardarán **únicamente en memoria** (ej. `BehaviorSubject` dentro del `AuthService`).
*   Si el usuario recarga el navegador (F5), la sesión en memoria se destruye. En el contexto de sucursales bancarias, esta es una característica de seguridad deseada contra ataques XSS.

### 2. El Interceptor (`AuthInterceptor`): Inyección y Transporte
*   Se implementará un `HttpInterceptor` global para las peticiones salientes.
*   Extraerá el `accessToken` en memoria del `AuthService` y lo inyectará en el header `Authorization: Bearer <tu_token_jwt>`.
*   Gestionará los errores genéricos para evitar el Information Disclosure.

### 3. El Guard (`AuthGuard`): Protección de Rutas
*   Verifica el estado del `AuthService`. Si existe un token vigente en memoria, permite la carga de la ruta.
*   Si no hay token, bloquea el acceso y redirige a la vista de login.

### 4. Rotación de Tokens (Refresh Flow)
*   Si el interceptor recibe un error `401`, pausará temporalmente las peticiones.
*   Enviará el `refreshToken` opaco de la memoria al endpoint `POST /api/v1/auth/refresh`.
*   Si tiene éxito, actualizará los tokens y reintentará la petición original. Si falla, el usuario será deslogueado.

---

## PARTE III: Plan de Implementación Integral

Este plan detalla los pasos finales para cumplir al 100% con los requerimientos estructurales y visuales.

### A. Arquitectura y Seguridad Base (Estructural)

#### [MODIFY] `angular.json` y `src/main.ts`
- **Anti-fingerprinting:** Configurar `"sourceMap": false` y `"optimization": true` en `angular.json`.
- Añadir `enableProdMode()` en `main.ts` para deshabilitar los metadatos y el atributo `ng-version`.

#### [NEW] `src/app/core/interceptors/auth.interceptor.ts`
- Crear el interceptor global para inyectar el token extraído de la memoria, manejar el Refresh Flow y capturar errores 500 para evitar Information Disclosure.

#### [MODIFY] `src/app/core/services/auth.service.ts`
- Eliminar el uso de `localStorage` o `sessionStorage` para el JWT y refactorizar para guardar `accessToken` y `refreshToken` únicamente en memoria.

#### [NEW/MODIFY] `src/app/shared/pipes/safe-html.pipe.ts`
- Implementar el uso estricto de `DomSanitizer` en componentes que utilicen `[innerHTML]`.

#### [MODIFY] `src/app/app.routes.ts`
- Implementar *Guards* (`CanActivate`) en las rutas con parámetros (ej. `/solicitudes/:id`) para validar que el ID sea un formato UUID válido.

---

### B. Modificaciones de UI/UX y Validaciones (Componentes)

#### Componentes UI Compartidos
- **[MODIFY] `button.ts` y `button.html`:** Reincorporar la propiedad `isLoading` y añadir el spinner SVG de carga cuando sea verdadero.
- **[NEW] `discrete-amount.ts`:** Crear el componente que ofusca montos (`$***.**`) por defecto, con botón de ojo para alternar visibilidad.

#### Vistas de Coordinador
- **[MODIFY] `caja-dispersion.html`:** Reemplazar botón nativo por `app-button` con estado de carga. Aplicar `app-discrete-amount`. Añadir `maxlength="6"` y `inputmode="numeric"` al input de autorización.
- **[MODIFY] `punto-atencion.html`:** Reemplazar botones nativos por `app-button`. Aplicar `app-discrete-amount`.
- **[MODIFY] `conciliacion.html`:** Reemplazar botón de "Aprobar Vales" por `app-button` con estado `isLoading`.
- **[MODIFY] `auditoria.html`, `transferencias.html`, `tokens.html`:** Añadir atributos `maxlength` a los `app-input`.

#### Vistas Globales / Verificador
- **[MODIFY] `login.html`:** Reemplazar botón de submit por `app-button`. Restaurar el botón de descartar ("X") en la alerta de error.
- **[MODIFY] `detalle-solicitud.html` (Verificador):** Reemplazar botón nativo de "Tomar y Visitar" por `app-button`.

### C. Verification Plan
- Compilar la aplicación (`npm run build`).
- Navegar localmente a las pantallas modificadas para verificar botones de carga, modo discreto, validaciones de input y que el borrado de sesión funcione al refrescar (F5).