# 🏗️ Organizador de Vistas por Entorno y Rol

---

# 💻 Entorno: Web Desktop (Escritorio)

Aplicaciones exclusivas para uso en computadora dentro de la sucursal o matriz.

## 1. Dashboard Gerente General (La Matriz)

Concentra el poder total del sistema y la creación de catálogos base.

### Gestión de Catálogos Maestros (CRUD)

- **Productos (Vales):** Creación estricta de montos cerrados (ej. $5,000, $10,000). Sin múltiplos fraccionados.
- **Categorías de Crédito:** Definir porcentajes de ganancia (ej. Plata 6%, Oro 10%).
- **Sucursales:** Alta y baja de sucursales físicas.
- **Gestión de Personal (CRUD):** Gerentes de Sucursal, Coordinadores, Verificadores, Cajeras.

### Configuración Operativa

- **Motor de Fechas:** Módulo dinámico para ingresar y configurar la Fecha de Corte y Fecha de Pago sin restricciones de días.

### Módulo de Aprobaciones y Solicitudes

- Dictamen final de nuevas Distribuidoras (Aceptar/Rechazar, asignar límite inicial y categoría).
- Aprobar/Modificar aumentos de crédito (Incentivos pre-autorizados).
- Autorización de conciliaciones manuales de pago.

### Reportes Globales (Lectura)

- Historial de relaciones globales, morosos, y expediente de todas las distribuidoras.

---

## 2. Dashboard Gerente de Sucursal

Mismas funciones administrativas, pero limitadas exclusivamente a su sucursal.

### Gestión Local (CRUD)

- Coordinadores, Verificadores y Cajeras de su sucursal.

### Configuración Operativa Local

- Definir Fechas de Corte y Fechas de Pago para las relaciones de su sucursal.

### Módulo de Aprobaciones Locales

- Aprobar nuevas Distribuidoras de su localidad.
- Aprobar/Modificar aumentos de crédito (Incentivos pre-autorizados por el coordinador).
- Autorización (Token) para que la cajera edite datos del cliente final si hay error en el INE.

### Reportes Locales (Lectura)

- Estado de cuenta (Relaciones) de sus distribuidoras.

---

## 3. Dashboard Cajera

Operación directa con el cliente final y manejo de flujo de dinero.

### Módulo de Liberación de Pago

#### Búsqueda por Folio

- Ingreso del folio generado por la distribuidora.

#### Flujo Pre-Vale

- Vista que exige cotejar INE + Comprobante de Domicilio.

#### Flujo Vale Digital

- Vista que exige cotejar Solo INE.

#### Generador de Disputa/Token

- Botón para pedir autorización al Gerente/Coordinador si los datos del cliente no coinciden con el documento físico.

#### Registro de Transferencia

- Captura del número de autorización bancaria tras depositar al cliente.

### Módulo de Conciliación de Pagos (Distribuidora)

#### Conciliación Automática

- Subida de archivo Excel bancario para hacer "match" automático con el código único de la Relación.

#### Conciliación Manual

- Vista para asignar un saldo no identificado al folio correcto (requiere autorización superior tras ver la foto del ticket físico).

#### Bandeja de Reclamos

- Notificaciones de distribuidoras sobre pagos no reflejados.

---

# 📱 Entorno: Tablet App

## 1. Dashboard Coordinador

Reclutamiento y gestión del equipo de distribuidoras.

### Módulo de Reclutamiento

- Formulario para llenar la pre-solicitud con datos generales de una nueva Distribuidora.

### Módulo de Auditoría (Edición)

- Edición de datos de una distribuidora existente.
- Regla de negocio: Todo guardado genera un log de auditoría (antes vs después).

### Gestión de Incentivos

- Revisión de historial limpio de la distribuidora y botón de "Pre-autorizar Aumento de Crédito" (envía la solicitud al Gerente).

### Módulo de Transferencias

- Bandeja para aprobar o rechazar que un cliente final cambie de distribuidora (para retenerlo si es buen cliente).

### Centro de Autorizaciones

- Generación de tokens para aprobar modificaciones de datos en caja o conciliaciones manuales.

---

## 2. Dashboard Verificador

Trabajo 100% de campo y validación física.

### Bandeja de Visitas

- Lista de pre-solicitudes asignadas por el coordinador.

### Módulo de Evidencia

- Cámara integrada para subir fotos del domicilio y documentos.

### Módulo de Dictamen

- Cajas de texto para comentarios y botones de estado final:
  - VERIFICADA
  - RECHAZADA

---

# 📲 Entorno: Mobile App (Smartphone)

## 1. Dashboard Distribuidora

Herramienta de venta y control de la persona que presta el dinero.

### Pantalla Principal (Status Financiero)

- Límite de Crédito Total.
- Crédito Disponible.
- Categoría actual.

### Módulo de Clientes

- Registro de nuevo cliente (Valida CURP a nivel global para que no exista con otra distribuidora).
- Búsqueda de clientes existentes en su cartera.

### Módulo Generador de Vales

#### Filtro Inteligente (Regla 50%)

- El catálogo de productos oculta los vales que superen el 50% del crédito disponible si es un Pre-vale, o si es el primer vale tras un aumento de crédito.

#### Bloqueo por Deuda

- Impide seleccionar a un cliente si tiene un vale activo/sin liquidar.

#### Generador de Folio

- Emite el número de referencia para que el cliente vaya a la sucursal.

### Módulo de Relaciones (Estado de Cuenta)

- Vista de las fechas de corte/pago actuales.
- Monto total a pagar.
- Código único de referencia para su depósito bancario.

### Módulo de Historial e Incentivos

- Historial de vales liquidados y progreso de su línea de crédito.
- Botón para "Solicitar Aumento de Crédito" (Se envía al coordinador).

### Módulo de Transferencias

- Opción de "Liberar/Previa Transferencia" de un cliente sin adeudos.
- Bandeja de "Aceptar Cliente Transferido" (cuando otra distribuidora suelta uno).

### Centro de Reclamos

- Subida de foto/comprobante cuando la caja no concilia su pago bancario (folio no reconocido).

---

# 🔄 Diagramas de Flujo (Reglas de Negocio)

## Flujo 1: Ciclo de Vida del Vale (Pre-Vale vs Vale Digital)

```text
[DISTRIBUIDORA - MOBILE]
   |
   +-- ¿El cliente es nuevo en el sistema?
        |
        +-- [SÍ] --> Se registra CURP y Domicilio.
        |            El sistema aplica Regla del 50% al límite disponible.
        |            Se genera Folio (Flujo: PRE-VALE).
        |
        +-- [NO] --> Se busca al cliente (Validación: No debe tener deuda).
                     El sistema permite prestar hasta el 100% disponible.
                     Se genera Folio (Flujo: VALE DIGITAL).
   |
[CLIENTE FINAL VA A SUCURSAL]
   |
[CAJERA - WEB DESKTOP]
   |
   +-- Ingresa Folio en el sistema.
   +-- ¿Qué tipo de Vale es?
        |
        +-- [PRE-VALE] -----> Pide INE + Comprobante de Domicilio.
        |                     ¿Datos coinciden?
        |                     |-- [NO] -> Pide Token al Coordinador/Gerente -> Edita.
        |                     |-- [SÍ] -> Realiza depósito y captura Num. Autorización.
        |
        +-- [VALE DIGITAL] -> Pide SOLO INE (Para cotejar rostro/identidad).
                              Realiza depósito y captura Num. Autorización.
```

---

## Flujo 2: Incentivos (Aumento de Crédito e Historial)

```text
[DISTRIBUIDORA - MOBILE]
   |-- Llega la Fecha de Corte -> Se genera Relación.
   |-- Distribuidora paga a tiempo antes de la Fecha de Pago.
   |-- Acumula historial limpio.
   |-- Solicita aumento de crédito en la App.
   v
[COORDINADOR - TABLET]
   |-- Revisa historial de pagos de la Distribuidora.
   |-- ¿Merece el aumento?
   |   |-- [SÍ] -> Aprueba "Pre-autorización".
   v
[GERENTE DE SUCURSAL / GENERAL - WEB DESKTOP]
   |-- Recibe Pre-autorización.
   |-- Evalúa riesgo financiero.
   |-- Modifica el monto (Ej. Piden $20k -> Autoriza $5k) y Acepta.
   v
[SISTEMA APLICA REGLA DE NEGOCIO AUTOMÁTICA]
   |-- Límite de crédito de la Distribuidora aumenta a $15,000.
   |-- SE ACTIVA CANDADO: El siguiente producto (Vale) a ofrecer NO puede
       superar el 50% del nuevo monto disponible.
```

---

## Flujo 3: Transferencia de Cliente (Migración entre Distribuidoras)

```text
[CLIENTE] -> Pide cambio porque la "Distribuidora A" le pone peros.
   v
[DISTRIBUIDORA "A" - MOBILE]
   |-- Verifica que el cliente NO tenga deuda.
   |-- Ejecuta "Previa Transferencia" hacia la Distribuidora "B".
   v
[DISTRIBUIDORA "B" - MOBILE]
   |-- Recibe la solicitud. Acepta recibir al cliente.
   v
[COORDINADOR DE LA DISTRIBUIDORA "A" - TABLET]
   |-- Recibe alerta: "Estás perdiendo un cliente final".
   |-- Evalúa si dejarlo ir o retenerlo.
   |-- Autoriza la transferencia.
   v
[SISTEMA]
   |-- El cliente pasa a la Distribuidora "B".
   |-- Su primer vale con la Distribuidora "B" será un VALE DIGITAL
       (porque ya existe en el sistema general, no requiere comprobante de domicilio en caja).
```