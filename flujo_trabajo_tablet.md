# Flujo de Trabajo en Tablet: Coordinador y Verificador

Con base en el análisis de las reglas de negocio y los requerimientos del proyecto, a continuación se detalla el flujo de trabajo operativo exclusivo para la tablet, el cual involucra a los roles de **Coordinador** y **Verificador**.

---

## 1. Regla Principal del Flujo ("Dos Datos")

- **Coordinador**: Es el único responsable de capturar y modificar la información del prospecto a distribuidora.
- **Verificador**: Nunca edita los datos capturados por el coordinador. Su trabajo es estrictamente de campo: asiste al domicilio, corrobora la información físicamente, toma fotografías, agrega notas y emite un dictamen final. Si detecta errores en la captura, solo los anota para que el Coordinador los corrija después.

---

## 2. Flujo de Trabajo (Paso a Paso)

### Paso 1: Captura Inicial (Coordinador)
1. El prospecto a distribuidora acude a la sucursal y se entrevista con el Coordinador. *(En este punto no hay interacción con el sistema)*.
2. Usando la tablet, el Coordinador inicia el alta y captura 12 campos de datos generales y 5 bloques de datos adicionales (vehículos, domicilio, referencias, etc.).
3. Al terminar, la solicitud queda en estado **`EN_VERIFICACION`**.

### Paso 2: Auto-Corrección Opcional (Coordinador)
1. Antes de que el Verificador realice la visita de campo, si el Coordinador detecta que escribió algo mal, puede editar la información libremente desde la tablet. Cada cambio queda registrado en la bitácora de auditoría.

### Paso 3: Visita de Campo y Dictamen (Verificador)
1. Desde su tablet, el Verificador observa las solicitudes `EN_VERIFICACION` y "toma" una para ir físicamente al domicilio.
2. En el sitio, toma fotografías de evidencia y redacta comentarios sobre la veracidad de la información.
3. Finalmente, emite un **Dictamen** desde la tablet que puede resultar en 3 escenarios:
   - **CUMPLE:** Todo está en orden. La solicitud avanza al estado `DICTAMINADA` para que un Gerente la revise.
   - **NO CUMPLE (con "Kill Switch"):** Si detecta fraude evidente (por ejemplo, identificaciones falsas o la casa no existe), el verificador activa un *kill switch* y la solicitud finaliza directamente como `RECHAZADA`.
   - **NO CUMPLE (sin "Kill Switch"):** Existen errores o diferencias menores que se pueden corregir. La solicitud pasa a `DICTAMINADA` pero con las observaciones claras para que sean atendidas.

### Paso 4: Corrección Post-Visita (Coordinador)
1. Si el Verificador arrojó el dictamen de "NO CUMPLE" por detalles menores (escenario 3), el Coordinador debe abrir la solicitud en la tablet y **corregir los datos** basándose en las notas del Verificador.
2. *Regla operativa:* La primera corrección es libre. Sin embargo, si vuelve a haber errores y necesita una segunda corrección, el sistema bloqueará la acción pidiendo la autorización en pantalla de un Gerente.
3. Al corregir la solicitud, esta vuelve al estado **`EN_VERIFICACION`** y el Verificador debe realizar una nueva visita (repite el Paso 3).

> [!NOTE]
> *(Una vez que la solicitud está validada correctamente y se encuentra `DICTAMINADA`, el flujo sale de las operaciones de la tablet. Corresponderá a los Gerentes evaluar desde su sistema web si autorizan el alta y la línea de crédito, o si rechazan la solicitud definitivamente).*

---

## 3. Guía de Endpoints por Rol

A continuación se enlistan los endpoints específicos que deben consumirse desde la aplicación de tablet, organizados por el rol que los utiliza.

### 3.1. Endpoints del Coordinador

El coordinador necesita listar, crear y corregir las solicitudes capturadas.

1. **Listar Solicitudes de su Sucursal:**
   - **`GET`** `/solicitudes`
   - *Permiso:* `distribuidor.solicitud.read`

2. **Ver el Detalle de una Distribuidora/Solicitud:**
   - **`GET`** `/distribuidores/:id`
   - *Permiso:* `distribuidor.read`

3. **Dar de Alta una Nueva Solicitud (Captura Inicial):**
   - **`POST`** `/solicitudes`
   - *Permiso:* `distribuidor.solicitud.create`
   - *Payload principal:*
     ```json
     {
       "datos_generales": {
         "nombre": "Juan",
         "apellido_paterno": "Perez",
         "apellido_materno": "Gomez",
         "rfc": "PEGJ800101XXX",
         "fecha_nacimiento": "1980-01-01",
         "calle": "Av. Principal",
         "numero": "123",
         "colonia": "Centro",
         "codigo_postal": "27000",
         "lugar_nacimiento": "Torreon",
         "estado": "COAHUILA",
         "ciudad": "Torreon"
       },
       "datos_adicionales": {
         "vehiculos": [ ... ],
         "domicilio": { ... },
         "referencias_laborales": [ ... ],
         "limites_credito_en_otras_relaciones": [ ... ],
         "familiares": [ ... ]
       }
     }
     ```

4. **Corregir/Editar una Solicitud:**
   - **`PATCH`** `/solicitudes/:id`
   - *Permiso:* `distribuidor.solicitud.update`
   - *Payload:* Envío parcial de los datos a corregir (por ejemplo, corregir la calle).
     ```json
     {
       "datos_generales": {
         "calle": "Av. Principal Sur"
       }
     }
     ```

---

### 3.2. Endpoints del Verificador

El verificador solo interactúa con las solicitudes que ya están en proceso y no puede modificar los textos capturados por el coordinador.

1. **Ver Solicitudes Pendientes (En Verificación):**
   - **`GET`** `/solicitudes`
   - *Permiso:* `distribuidor.solicitud.read`
   - *Comportamiento:* Retorna las solicitudes cuyo estado es `EN_VERIFICACION` para su zona.

2. **Asignarse/Tomar una Solicitud:**
   - **`POST`** `/solicitudes/:id/tomar`
   - *Permiso:* `distribuidor.solicitud.take`
   - *Payload:* Ninguno (Body vacío). Bloquea la solicitud para evitar conflictos.

3. **Enviar Dictamen de Verificación:**
   - **`POST`** `/solicitudes/:id/verificar`
   - *Permiso:* `distribuidor.solicitud.verify`
   - *Payload:* Envía fotografías, notas y la decisión.
     ```json
     {
       "fotos_verificacion": [
         "https://storage.yacatec.com/fotos/fachada_123.jpg",
         "https://storage.yacatec.com/fotos/ine_123.jpg"
       ],
       "comentarios_verificador": "Todo coincide. Las referencias validan a la persona.",
       "dictamen": "CUMPLE",
     *(Nota: si el `kill_switch` es `true` y el dictamen es `NO_CUMPLE`, la solicitud queda `RECHAZADA`).*

---

### 3.3. Endpoints Transversales (Ambos Roles)

Para que el flujo anterior funcione, la aplicación de tablet también debe consumir estos endpoints generales de la API:

1. **Autenticación (Login):**
   - **`POST`** `/auth/login`
   - *Uso:* Tanto el coordinador como el verificador deben iniciar sesión en la tablet para obtener su token (JWT) que los identifica y les otorga los permisos mencionados.

2. **Subida de Archivos (Uploads):**
   - **`POST`** `/uploads` (o ruta equivalente del módulo de archivos)
   - *Uso:* Antes de que el Verificador pueda enviar el dictamen final con `POST /solicitudes/:id/verificar`, **primero debe subir físicamente las fotos tomadas**. Este endpoint recibe las imágenes y retorna las URLs estáticas que luego se colocan en el arreglo `fotos_verificacion`.

---

## 4. Requisitos para la Integración Frontend (Contexto para IA / Developers)

Para que una IA o un desarrollador frontend pueda programar la integración completa sin dudas, además de los payloads de envío, se deben tomar en cuenta los siguientes **estándares de respuesta y error** del backend:

### 4.1. Cabeceras (Headers) de Autorización
Todas las peticiones protegidas (todas las del Coordinador y Verificador) deben enviar el token JWT obtenido en el login dentro de los Headers:
```http
Authorization: Bearer <tu_token_jwt_aqui>
```

### 4.2. Estructura de Respuesta Estándar (Envelope)
El backend siempre responde utilizando un "Envelope" (Envoltorio) uniforme. La data real viene dentro del atributo `data`.
**Ejemplo de respuesta exitosa (200 / 201):**
```json
{
  "message": "Operación exitosa",
  "data": { ... }, // Aquí viene el ID creado, o la lista de solicitudes
  "error": null
}
```

### 4.3. Manejo de Errores Específicos (Códigos)
El frontend debe estar preparado para leer la propiedad `error.code` y mostrar el feedback adecuado al usuario en la tablet. Los errores devuelven un status HTTP (400, 403, 404, 409) y un JSON como este:
```json
{
  "message": "Error de validación",
  "data": null,
  "error": {
    "code": "DISTRIBUIDORES.VALIDATION",
    "details": ["El RFC es inválido"]
  }
}
```

**Principales códigos a interceptar en la Tablet:**
- `DISTRIBUIDORES.VALIDATION` (400): Faltan campos o son incorrectos en la captura.
- `DISTRIBUIDORES.COORDINATOR_NO_BRANCH` / `DISTRIBUIDORES.VERIFIER_NO_BRANCH` (403): El usuario logueado no tiene una sucursal asignada.
- `DISTRIBUIDORES.NOT_IN_VERIFICATION` (409): El verificador intentó tomar una solicitud que ya fue dictaminada por alguien más.
- `DISTRIBUIDORES.NOT_EDITABLE` (409): El Coordinador intentó corregir una solicitud que ya está autorizada o rechazada.
- `DISTRIBUIDORES.MODIFICATION_REQUIRES_AUTH` (403): El Coordinador intentó hacer una *segunda* edición, y el frontend debe mostrar un popup pidiendo credenciales/autorización del Gerente.
