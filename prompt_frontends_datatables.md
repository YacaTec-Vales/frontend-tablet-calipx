# Guía y Prompt de Optimización de Tablas (Frontend)

Copia y pega este texto a tus desarrolladores Frontend (o agentes de IA) para que repliquen la optimización de rendimiento en todas las pantallas del sistema:

***

**Asunto: Refactorización Obligatoria - Optimización de Datatables y Paginación (Server-Side) para Rendimiento Extremo**

Hola equipo,

Debido a problemas de rendimiento al manejar grandes volúmenes de datos, necesitamos refactorizar **todas las vistas y tablas** del sistema para abandonar la paginación local y migrar a una arquitectura estricta de paginación del servidor (*Server-Side Pagination*) con limpieza de nodos DOM.

Por favor, apliquen los siguientes patrones obligatorios en todas las pantallas donde trabajen:

### 1. Lazy Loading de Pestañas (Tabs)
**NUNCA** carguen toda la información de todas las pestañas al inicializar un componente (dentro del `ngOnInit`). 
* La carga inicial **solo** debe disparar la petición HTTP de la pestaña activa por defecto.
* Las peticiones de las demás pestañas deben dispararse **únicamente** cuando el usuario hace clic sobre ellas. Utilicen variables bandera (`isDataLoaded = false`) para evitar peticiones repetidas si el usuario vuelve a una pestaña que ya había cargado.

### 2. Paginación Estricta del Servidor (Límite de 100 Registros)
Queda prohibido solicitar catálogos o listados completos al Backend sin límites.
* Todos los servicios HTTP (`services`) deben configurarse para enviar parámetros de paginación por defecto: `?page=1&limit=100`.
* Si el endpoint del backend aún no soporta `page` y `limit` en su DTO (ej. responde con error `400 BAD_REQUEST`), **no bloqueen la UI**. De manera temporal, reciban la lista completa pero **paginen localmente cortando el array** (usando `.slice()`) dentro del `map` del servicio para entregar exactamente 100 registros al componente.

### 3. Destrucción y Reemplazo de Nodos DOM (app-table)
No podemos usar librerías de datatables que carguen miles de registros ocultándolos por CSS, ya que esto congela la RAM del navegador.
Debemos utilizar nuestro `<app-table>` base con la configuración de servidor activada.

Implementen la tabla exactamente con esta estructura:
```html
<app-table 
  title="Mi Listado" 
  [dataTrigger]="miArrayDeDatos"
  [columns]="['Columna 1', 'Columna 2', 'Acciones']"
  [useServerPagination]="true" 
  [currentPage]="miPaginaActual" 
  [totalItems]="miTotalDeItems" 
  [limit]="100"
  (pageChange)="onPageChange($event)">
  
  <tr *ngFor="let item of miArrayDeDatos" class="bg-white border-b hover:bg-gray-50">
     <!-- Celdas -->
  </tr>
</app-table>
```

**Regla de Oro en el Componente (`.ts`):**
Cuando el usuario pida la página 2, la función `onPageChange` debe actualizar la variable de página y hacer la nueva petición HTTP. Al recibir los nuevos datos, **se debe sobreescribir por completo** el arreglo actual (`this.miArrayDeDatos = res.data`). 

Al vaciar el arreglo viejo y asignar uno nuevo, Angular se encargará automáticamente de destruir los 100 nodos HTML (`<tr>`) de la página anterior y pintar 100 nodos totalmente nuevos. Esto mantiene la aplicación ligera y a prueba de millones de registros.

### 4. Búsqueda desde el Servidor
Dado que ahora el Frontend solo conoce 100 registros a la vez, las barras de "Búsqueda" o filtros de la tabla ya no pueden filtrar un arreglo local.
* Cuando el usuario escriba en el buscador de la tabla, la búsqueda debe reiniciar la página a `1` y disparar una petición HTTP con el parámetro `search=termino`. (Ej: `GET /endpoint?page=1&limit=100&search=Juan`).

***
