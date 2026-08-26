# Flujo de Trabajo en Tablet: Coordinador y Verificador

Basándonos en la documentación de la API, la aplicación de la tablet interactúa principalmente con el proceso de "Solicitudes" (alta de nuevas distribuidoras) y la gestión en campo. Los dos roles principales que usarán la tablet son el **Coordinador** y el **Verificador**.

A continuación, se detalla el flujo de trabajo para cada rol y los endpoints necesarios para implementar sus funcionalidades en el frontend de la tablet.

---

## 1. Autenticación y Sesión (Ambos Roles)
Para que los usuarios puedan utilizar la aplicación, es necesario manejar la sesión y determinar el perfil para renderizar las vistas correctas.

| Acción | Método | Endpoint | Descripción |
| :--- | :--- | :--- | :--- |
| **Iniciar sesión** | `POST` | `/api/v1/auth/login` | Recibe credenciales y devuelve tokens de acceso. |
| **Renovar token** | `POST` | `/api/v1/auth/refresh` | Rota el refresh token cuando expira el token de acceso. |
| **Obtener perfil** | `GET` | `/api/v1/auth/me` | Sirve para conocer el rol del usuario autenticado y sus permisos. |
| **Cerrar sesión** | `POST` | `/api/v1/auth/logout` | Cierra la sesión activa en el dispositivo. |
| **Subir archivos** | `POST` | `/api/v1/uploads` | Subida de fotos, documentos (INE, comprobantes, fotos de fachada) al storage. |

---

## 2. Flujo de Trabajo: Coordinador
El coordinador tiene la tarea de prospectar y registrar solicitudes para nuevas distribuidoras, así como dar seguimiento a las distribuidoras que ya tiene asignadas.

### A. Prospección (Solicitudes)
1. **Ver bandeja de solicitudes:** El coordinador revisa el estado de sus solicitudes ingresadas.
2. **Crear solicitud:** Recopila información en campo (los 12 datos generales) de una prospecto.
3. **Editar solicitud:** Puede modificar la información o subir documentos faltantes si la solicitud aún lo permite.

### B. Gestión de Distribuidoras
1. **Mis distribuidoras:** Consulta la lista de distribuidoras activas que están bajo su cargo.
2. **Aumentos de crédito:** A petición de la distribuidora, el coordinador ingresa la solicitud para aumentarle la línea de crédito.

### Endpoints Necesarios para el Coordinador
| Método | Endpoint | Acción que permite |
| :--- | :--- | :--- |
| `GET` | `/api/v1/solicitudes` | Listar la bandeja de solicitudes. |
| `GET` | `/api/v1/solicitudes/{id}` | Ver los detalles de una solicitud específica. |
| `POST` | `/api/v1/solicitudes` | Crear una nueva solicitud (alta cruda con datos generales). |
| `PATCH` | `/api/v1/solicitudes/{id}` | Editar datos de una solicitud existente. |
| `GET` | `/api/v1/coordinadores/{id}/distribuidoras` | Listar distribuidoras asignadas al coordinador. |
| `GET` | `/api/v1/distribuidores/{id}` | Ver detalle de una distribuidora activa. |
| `POST` | `/api/v1/distribuidores/{id}/credit-raise-requests` | Crear una solicitud para aumento de línea de crédito. |
| `GET` | `/api/v1/distribuidores/{id}/credit-raise-requests` | Ver historial y estado de las solicitudes de aumento de una distribuidora. |

> [!NOTE]
> Dependiendo de los requerimientos de visualización, el Coordinador también podría requerir acceder a `GET /api/v1/relations` para revisar el estatus de cobros o pagos de sus distribuidoras.

---

## 3. Flujo de Trabajo: Verificador
El verificador se encarga de visitar el domicilio de la solicitud para corroborar los datos, tomar fotografías del entorno y emitir un dictamen de riesgo que permitirá al Gerente tomar una decisión final.

### A. Verificación en Campo
1. **Bandeja de verificación:** Consulta el listado de solicitudes que están pendientes por verificar.
2. **Tomar una solicitud:** Se asigna la solicitud a sí mismo para bloquear que otros verificadores la tomen y notificar que está en camino.
3. **Visita y Dictamen:** Una vez en el sitio, captura fotos, ingresa sus comentarios de la evaluación, define si el dictamen es favorable y llena la evaluación de riesgo ("kill switch").

### Endpoints Necesarios para el Verificador
| Método | Endpoint | Acción que permite |
| :--- | :--- | :--- |
| `GET` | `/api/v1/solicitudes` | Listar la bandeja de solicitudes (filtrado por estado "pendiente de verificar"). |
| `GET` | `/api/v1/solicitudes/{id}` | Consultar todos los datos e información capturada por el coordinador para poder hacer la verificación cruzada. |
| `POST` | `/api/v1/solicitudes/{id}/tomar` | El verificador se asigna esta solicitud para visitarla. |
| `POST` | `/api/v1/solicitudes/{id}/verificar` | Registra el resultado (dictamen, comentarios, fotos y kill switch). |

> [!TIP]
> El endpoint `POST /api/v1/uploads` es de uso intensivo para el verificador, ya que desde la tablet capturará fotos de la fachada, interior y documentos, que deben subirse antes de ejecutar `POST /api/v1/solicitudes/{id}/verificar`.
