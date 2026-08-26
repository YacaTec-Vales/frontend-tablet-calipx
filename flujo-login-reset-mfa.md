# Flujo Propuesto: Login -> Cambio de Contraseña -> Configuración de MFA

Este documento describe el flujo para forzar a un usuario a cambiar su contraseña predeterminada antes de obligarlo a configurar su segundo factor de autenticación (TOTP).

## Flujo Actual

1. El usuario ingresa sus credenciales (email y contraseña) en la pantalla de `login`.
2. Se envía la petición `POST /api/v1/auth/login`.
3. Si el usuario no tiene MFA habilitado (`user.mfaEnabled === false`), el backend responde exitosamente pero indica que se requiere configuración.
4. El frontend automáticamente llama a `POST /api/v1/mfa/setup` para obtener la URL del QR.
5. El usuario ve la pantalla para escanear el QR e ingresa el código de 6 dígitos.
6. Se envía el código a `POST /api/v1/mfa/verify-setup` para finalizar el login.

*(Actualmente en `login.ts` se observa que si `user.mustChangePassword` es `true`, solo se imprime un `console.warn` al final del proceso de login exitoso).*

---

## Nuevo Flujo Propuesto (Login -> Reset Password -> Setup MFA)

Para asegurar que la contraseña por defecto sea cambiada **antes** de vincular el dispositivo MFA, se debe agregar un paso intermedio.

### 1. Autenticación Inicial
El usuario ingresa su correo y contraseña (la generada por defecto). Se llama a `POST /api/v1/auth/login`.
- Si las credenciales son correctas, el backend devolverá el objeto `user` y un token temporal (o token completo con permisos reducidos).
- El frontend debe evaluar la bandera `user.mustChangePassword` (o interceptar un código de error específico como `401 AUTH.PASSWORD_NOT_SET` si el backend lo maneja como error en el login).

### 2. Paso de Cambio de Contraseña (Nueva Vista / Estado)
Si `mustChangePassword === true`:
- El componente `Login` cambia a un nuevo estado: `this.step = 'change_password'`.
- Se muestra un formulario pidiendo la **Nueva Contraseña** y **Confirmar Nueva Contraseña**.
- Al enviar este formulario, se llama al endpoint `POST /api/v1/auth/change-password` usando el token parcial obtenido en el login, y enviando la contraseña actual (si el DTO lo requiere) junto con la nueva.

### 3. Transición a Configuración de MFA
Una vez que el cambio de contraseña es exitoso (respuesta 200 de `/api/v1/auth/change-password`):
- El backend suele devolver un nuevo `accessToken` o mantener la sesión actualizada.
- El frontend evalúa si el usuario también necesita configurar MFA (`user.mfaEnabled === false`).
- Si necesita MFA, se llama a `POST /api/v1/mfa/setup` (como se hace actualmente) usando el nuevo token.
- El componente `Login` cambia al estado: `this.step = 'mfa_setup'`.
- Se muestra el código QR al usuario.

### 4. Vinculación de TOTP (MFA)
- El usuario escanea el QR y digita el código de 6 dígitos de su app (ej. Google Authenticator).
- Se llama a `POST /api/v1/mfa/verify-setup`.
- Al ser exitoso, se guardan los tokens finales en `sessionStorage` y se redirige al usuario a su panel correspondiente según su rol (Cajera, Gerente, etc.).

---

## Modificaciones Necesarias en el Código

### En `src/app/pages/login/login.ts`
1. Agregar el nuevo estado: `step: 'login' | 'change_password' | 'mfa_verify' | 'mfa_setup' = 'login';`
2. Modificar la función `onSubmit` para que antes de pasar a `mfa_setup`, verifique `loginData.user.mustChangePassword`.
3. Agregar variables para el formulario de cambio de contraseña: `newPassword`, `confirmPassword`.
4. Crear la función `onChangePassword(event: Event)` que llame al servicio de autenticación para cambiar la contraseña, y en el bloque `next` evalúe si se debe pasar a `mfa_setup` o directo al dashboard.

### En `src/app/core/services/auth.service.ts`
1. Asegurar que exista un método para cambiar la contraseña consumiendo `/api/v1/auth/change-password`:
   ```typescript
   changePassword(token: string, currentPassword: string, newPassword: string): Observable<any> {
     return this.http.post(`${this.baseUrl}/change-password`, 
       { currentPassword, newPassword }, 
       { headers: { Authorization: `Bearer ${token}`, 'X-Origin': 'vpn', 'X-Client-App': 'Tecu' } }
     );
   }
   ```

### En `src/app/pages/login/login.html`
- Agregar el bloque `*ngIf="step === 'change_password'"` con el formulario correspondiente (input para nueva contraseña, confirmar nueva contraseña, y botón de guardar).
