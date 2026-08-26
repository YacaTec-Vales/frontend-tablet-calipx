# Flujo de Pruebas de la Tablet (Front-to-Back)

Esta guía detalla el paso a paso exacto para probar la integración completa que acabamos de realizar entre la aplicación frontend de la tablet y tu backend.

## Prerrequisitos
- Asegurarte de que el backend (API) esté corriendo localmente o en el entorno configurado en `src/environments/environment.ts`.
- Mantener ejecutándose el comando `npm start` en el frontend.

---

## Escenario 1: Flujo Feliz (Aprobación Exitosa)

### Fase A: Captura (Coordinador)
1. Ingresa a `http://localhost:4202` (o el puerto que asigne Angular).
2. **Inicia sesión** con las credenciales del Coordinador (`test.coord@yacatec.test` / `Demo1234!`).
3. En el menú lateral, ve a **Reclutamiento**.
4. Llena los 12 campos obligatorios de "Datos Generales" (asegúrate de usar un RFC de 13 caracteres, ej: `GAMA800101ABC`).
5. Presiona **Generar Solicitud**.
   - *Comportamiento esperado:* Alerta verde indicando que se creó con éxito. 
6. Ve a tu **Bandeja** desde el menú lateral.
   - *Comportamiento esperado:* La solicitud recién creada debe aparecer en la tabla con el estado `En Verificación`.
7. Cierra sesión usando el botón del menú lateral inferior.

### Fase B: Verificación de Campo (Verificador)
1. **Inicia sesión** con las credenciales del Verificador (`test.verif@yacatec.test` / `Demo1234!`).
2. Entrarás automáticamente a la vista **Bandeja de Visitas**.
   - *Comportamiento esperado:* Debes ver la solicitud que creó el Coordinador en la lista.
3. Haz clic en **Tomar y Visitar**.
   - *Comportamiento esperado:* La aplicación bloquea la solicitud (`POST /tomar`) y te redirige a la pantalla de captura de campo.
4. En el **Formulario de Campo**, simula la subida de fotos (esto emulará la evidencia), escribe al menos 5 caracteres en comentarios y presiona **Cumple**.
   - *Comportamiento esperado:* La solicitud avanza y eres redirigido a la bandeja. El estado de la solicitud en el backend ahora debería ser `DICTAMINADA`.

---

## Escenario 2: Flujo de Corrección (NO CUMPLE)

### Fase A: Verificador Rechaza (Sin Kill Switch)
1. Repite el proceso de creación (Fase A del Escenario 1).
2. Inicia sesión como **Verificador**, toma la solicitud y ve al Formulario de Campo.
3. Agrega fotos, un comentario (ej: *"La calle no coincide, es Av. Reforma, no Av. Juárez"*) y asegúrate de **NO marcar** el Kill Switch.
4. Presiona el botón **No Cumple**.
   - *Comportamiento esperado:* La solicitud pasa a `DICTAMINADA` pero con las observaciones guardadas.

### Fase B: Coordinador Corrige
1. Inicia sesión de vuelta como **Coordinador**.
2. Ve a tu **Bandeja**.
   - *Comportamiento esperado:* La solicitud aparecerá con una advertencia en rojo indicando **"Requiere Corrección"**.
3. Haz clic en el botón **Corregir**.
4. Serás llevado a la pantalla de Edición. Modifica la calle (como indicó el verificador) y presiona **Guardar Cambios**.
   - *Comportamiento esperado:* La solicitud vuelve a estado `En Verificación` y está lista para que el Verificador regrese al domicilio.

---

## Escenario 3: Rechazo Directo (Kill Switch)

1. Como **Coordinador**, crea una solicitud nueva.
2. Como **Verificador**, toma la solicitud.
3. En el formulario, activa explícitamente la opción **Kill Switch** (fraude evidente) y presiona **No Cumple**.
   - *Comportamiento esperado:* La solicitud pasa automáticamente a estado `RECHAZADA`.
4. Si el Coordinador entra a su Bandeja e intenta verla, ya no tendrá habilitado el botón de "Corregir" porque el estado es final.

---

## Escenario 4: Pruebas de Errores (Edge Cases)

1. **Error de Validación (`DISTRIBUIDORES.VALIDATION`):** 
   - Modifica el código fuente temporalmente para forzar el envío de un formulario vacío de Coordinador, o intercepta la petición. El frontend debe mostrarte la alerta: "Faltan campos o el formato es incorrecto".
2. **Conflicto de Toma (`DISTRIBUIDORES.NOT_IN_VERIFICATION`):**
   - Abre el perfil del verificador en 2 pestañas distintas del navegador. 
   - En la primera, toma la solicitud.
   - En la segunda pestaña, intenta tomar la misma solicitud.
   - *Comportamiento esperado:* Alerta roja indicando "Esta solicitud ya fue tomada o ya no está en verificación".
3. **Bloqueo por Segunda Edición (`DISTRIBUIDORES.MODIFICATION_REQUIRES_AUTH`):**
   - Tras corregir una vez (Escenario 2), haz que el verificador la vuelva a rechazar con "No Cumple".
   - Al intentar corregirla por segunda vez y presionar "Guardar Cambios", el frontend debe arrojar una alerta indicando que "Se requiere autorización de un Gerente" y bloquear la petición.
